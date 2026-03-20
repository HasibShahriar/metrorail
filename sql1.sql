USE master;
GO
IF DB_ID('metro_db') IS NOT NULL
BEGIN
    ALTER DATABASE metro_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE metro_db;
END
GO
CREATE DATABASE metro_db;
GO
USE metro_db;
GO

----------------------------------------------------------------------------------
-- 1. CORE TABLES
----------------------------------------------------------------------------------
CREATE TABLE Route (
    route_id INT IDENTITY(1,1) PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    total_distance FLOAT NOT NULL
);

CREATE TABLE Station (
    station_id INT IDENTITY(1,1) PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    location VARCHAR(200)
);

CREATE TABLE Train (
    train_id INT IDENTITY(1,1) PRIMARY KEY,
    train_name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    route_id INT,
    FOREIGN KEY (route_id) REFERENCES Route(route_id)
);

CREATE TABLE Schedule (
    schedule_id INT IDENTITY(1,1) PRIMARY KEY,
    train_id INT,
    station_id INT,
    arrival_time TIME,
    departure_time TIME,
    FOREIGN KEY (train_id) REFERENCES Train(train_id),
    FOREIGN KEY (station_id) REFERENCES Station(station_id)
);

CREATE TABLE Employee (
    employee_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100),
    nid VARCHAR(30),
    role VARCHAR(50),
    shift VARCHAR(50),
    station_id INT NULL,
    train_id INT NULL,
    FOREIGN KEY (station_id) REFERENCES Station(station_id),
    FOREIGN KEY (train_id) REFERENCES Train(train_id)
);

CREATE TABLE Passenger (
    passenger_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    nid VARCHAR(20) UNIQUE NOT NULL,
    account_balance FLOAT DEFAULT 0.0,
    role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE Recharge_Transaction (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,
    passenger_id INT,
    amount FLOAT,
    recharge_date DATETIME,
    payment_method VARCHAR(50),
    FOREIGN KEY (passenger_id) REFERENCES Passenger(passenger_id)
);

CREATE TABLE Fine (
    fine_id INT IDENTITY(1,1) PRIMARY KEY,
    passenger_id INT,
    reason VARCHAR(200),
    date DATE,
    amount FLOAT,
    status VARCHAR(20) DEFAULT 'Unpaid',
    FOREIGN KEY (passenger_id) REFERENCES Passenger(passenger_id)
);

CREATE TABLE Passenger_movement (
    passenger_movement_id INT IDENTITY(1,1) PRIMARY KEY,
    passenger_id INT,
    entry_station_id INT,
    exit_station_id INT NULL,
    entry_time DATETIME,
    exit_time DATETIME NULL,
    fare FLOAT NULL,
    FOREIGN KEY (passenger_id) REFERENCES Passenger(passenger_id),
    FOREIGN KEY (entry_station_id) REFERENCES Station(station_id),
    FOREIGN KEY (exit_station_id) REFERENCES Station(station_id)
);

CREATE TABLE Train_status (
    train_status_id INT IDENTITY(1,1) PRIMARY KEY,
    train_id INT,
    update_time DATETIME,
    status VARCHAR(50),
    date DATE,
    FOREIGN KEY (train_id) REFERENCES Train(train_id),
    CONSTRAINT chk_train_status CHECK (status IN ('Running','Delayed','At Station','Departing','Emergency Stop','Standby'))
);

CREATE TABLE Route_station (
    route_id INT,
    station_id INT,
    station_order INT,
    distance_from_start FLOAT,
    PRIMARY KEY (route_id, station_id),
    FOREIGN KEY (route_id) REFERENCES Route(route_id),
    FOREIGN KEY (station_id) REFERENCES Station(station_id)
);



CREATE TABLE Audit_Log (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    table_name VARCHAR(50),
    action_type VARCHAR(50),
    old_value VARCHAR(MAX),
    new_value VARCHAR(MAX),
    timestamp DATETIME DEFAULT GETDATE(),
    changed_by VARCHAR(100) DEFAULT CURRENT_USER
);
GO

----------------------------------------------------------------------------------
-- INDEXES
----------------------------------------------------------------------------------
CREATE NONCLUSTERED INDEX IX_Passenger_Movement_EntryTime ON Passenger_movement(entry_time);
CREATE NONCLUSTERED INDEX IX_Fine_Status ON Fine(status, date);
CREATE NONCLUSTERED INDEX IX_TrainStatus_Update ON Train_status(update_time DESC);
GO

----------------------------------------------------------------------------------
-- 2. VIEWS
----------------------------------------------------------------------------------
CREATE VIEW vw_RevenueAnalytics AS
SELECT
    revenue_date,
    SUM(trips) as total_trips,
    SUM(fare) as total_fare_revenue,
    SUM(fines) as total_fine_revenue
FROM (
    SELECT CAST(entry_time AS DATE) as revenue_date, COUNT(*) as trips, SUM(ISNULL(fare,0)) as fare, 0 as fines
    FROM Passenger_movement
    WHERE exit_time IS NOT NULL
    GROUP BY CAST(entry_time AS DATE)
    UNION ALL
    SELECT CAST(date AS DATE) as revenue_date, 0 as trips, 0 as fare, SUM(amount) as fines
    FROM Fine
    WHERE status = 'Paid'
    GROUP BY CAST(date AS DATE)
) SalesHistory
GROUP BY revenue_date;
GO

CREATE VIEW vw_LatestTrainStatus AS
WITH RankedStatus AS (
    SELECT
        ts.train_id, t.train_name, ISNULL(r.route_name, 'Unassigned') as route_name, ts.status, ts.update_time,
        ROW_NUMBER() OVER (PARTITION BY ts.train_id ORDER BY ts.update_time DESC, ts.train_status_id DESC) as rn
    FROM Train_status ts
    JOIN Train t ON ts.train_id = t.train_id
    LEFT JOIN Route r ON t.route_id = r.route_id
)
SELECT train_id, train_name, route_name, status, update_time FROM RankedStatus WHERE rn = 1;
GO

CREATE VIEW vw_BusiestStations AS
SELECT
    s.station_id,
    s.station_name,
    COUNT(pm.passenger_movement_id) AS total_passenger_traffic
FROM Station s
LEFT JOIN Passenger_movement pm ON pm.entry_station_id = s.station_id OR pm.exit_station_id = s.station_id
GROUP BY s.station_id, s.station_name;
GO

----------------------------------------------------------------------------------
-- 3. FUNCTIONS
----------------------------------------------------------------------------------

CREATE FUNCTION fn_CalculateFare (@entry_station_id INT, @exit_station_id INT)
RETURNS FLOAT
AS
BEGIN
    DECLARE @route_id INT, @start_dist FLOAT, @end_dist FLOAT;
    DECLARE @fare_per_km FLOAT = 5.0;

    SELECT TOP 1 @route_id = r1.route_id
    FROM Route_station r1
    INNER JOIN Route_station r2 ON r1.route_id = r2.route_id
    WHERE r1.station_id = @entry_station_id AND r2.station_id = @exit_station_id;

    IF @route_id IS NULL RETURN 0.0; -- Standard behavior for unlinked routes

    SELECT @start_dist = distance_from_start FROM Route_station WHERE route_id = @route_id AND station_id = @entry_station_id;
    SELECT @end_dist = distance_from_start FROM Route_station WHERE route_id = @route_id AND station_id = @exit_station_id;

    RETURN 20.0 + (ABS(@end_dist - @start_dist) * @fare_per_km);
END;
GO

CREATE FUNCTION fn_RouteEstimator (@from_id INT, @to_id INT)
RETURNS @ResultData TABLE (Distance FLOAT, EstimatedFare FLOAT, EstimatedMinutes INT)
AS
BEGIN
    DECLARE @route_id INT;
    DECLARE @start_dist FLOAT = 0.0;
    DECLARE @end_dist FLOAT = 0.0;

    SELECT TOP 1 @route_id = r1.route_id
    FROM Route_station r1 INNER JOIN Route_station r2 ON r1.route_id = r2.route_id
    WHERE r1.station_id = @from_id AND r2.station_id = @to_id;

    IF @route_id IS NOT NULL
    BEGIN
        SELECT @start_dist = distance_from_start FROM Route_station WHERE route_id = @route_id AND station_id = @from_id;
        SELECT @end_dist   = distance_from_start FROM Route_station WHERE route_id = @route_id AND station_id = @to_id;
        INSERT INTO @ResultData
        VALUES (ABS(@end_dist - @start_dist), dbo.fn_CalculateFare(@from_id, @to_id), CAST((ABS(@end_dist-@start_dist)*2.5) AS INT));
    END
    RETURN;
END;
GO

CREATE FUNCTION fn_GetPassengerTier (@passenger_id INT) RETURNS VARCHAR(10)
AS
BEGIN
    DECLARE @total_spent FLOAT;
    SELECT @total_spent = ISNULL(SUM(fare), 0)
    FROM Passenger_movement
    WHERE passenger_id = @passenger_id AND exit_time IS NOT NULL;

    RETURN CASE
        WHEN @total_spent >= 5000 THEN 'Gold'
        WHEN @total_spent >= 1000 THEN 'Silver'
        ELSE 'Bronze'
    END;
END;
GO

----------------------------------------------------------------------------------
-- 4. STORED PROCEDURES
----------------------------------------------------------------------------------

CREATE PROCEDURE sp_GetActiveJourney
    @passenger_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 pm.passenger_movement_id, pm.entry_station_id, s.station_name as entry_station_name, pm.entry_time
    FROM Passenger_movement pm
    INNER JOIN Station s ON pm.entry_station_id = s.station_id
    WHERE pm.passenger_id = @passenger_id AND pm.exit_time IS NULL
    ORDER BY pm.entry_time DESC;
END;
GO


CREATE PROCEDURE sp_CheckinPassenger
    @passenger_id     INT,
    @entry_station_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM Passenger_movement WHERE passenger_id = @passenger_id AND exit_time IS NULL)
            RAISERROR('Already checked in. Complete your current journey first.', 16, 1);

        DECLARE @total_fines FLOAT;
        SELECT @total_fines = ISNULL(SUM(amount), 0) FROM Fine WHERE passenger_id = @passenger_id AND status = 'Unpaid';
        
        IF @total_fines > 1000
        BEGIN
            RAISERROR('Entry denied: Outstanding fines exceed ৳1000.', 16, 1);
            RETURN;
        END;

        INSERT INTO Passenger_movement (passenger_id, entry_station_id, entry_time)
        VALUES (@passenger_id, @entry_station_id, GETDATE());

        SELECT SCOPE_IDENTITY() AS new_movement_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END;
GO


CREATE PROCEDURE sp_CheckoutPassenger
    @movement_id     INT,
    @exit_station_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @entry_station_id INT, @passenger_id INT, @calculated_fare FLOAT, @current_balance FLOAT;

        SELECT @entry_station_id = entry_station_id, @passenger_id = passenger_id
        FROM Passenger_movement
        WHERE passenger_movement_id = @movement_id AND exit_time IS NULL;

        IF @passenger_id IS NULL
            RAISERROR('Movement record not found or already checked out.', 16, 1);

        SET @calculated_fare = dbo.fn_CalculateFare(@entry_station_id, @exit_station_id);

        UPDATE Passenger_movement
        SET exit_station_id = @exit_station_id, exit_time = GETDATE(), fare = @calculated_fare
        WHERE passenger_movement_id = @movement_id;

        SELECT @current_balance = account_balance FROM Passenger WHERE passenger_id = @passenger_id;

        IF (@current_balance - @calculated_fare) < 0
        BEGIN
            INSERT INTO Fine (passenger_id, reason, date, amount, status)
            VALUES (@passenger_id,
                    'Insufficient balance on exit (owed fare: ' + CAST(CAST(@calculated_fare AS INT) AS VARCHAR) + ' tk)',
                    CAST(GETDATE() AS DATE), 500.0, 'Unpaid');
        END
        ELSE
        BEGIN
            UPDATE Passenger
            SET account_balance = account_balance - @calculated_fare
            WHERE passenger_id = @passenger_id;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE PROCEDURE sp_GetPassengerHistory
    @passenger_id INT
AS
BEGIN
    SELECT
        pm.passenger_movement_id,
        pm.entry_time,
        es.station_name AS entry_station_name,
        pm.exit_time,
        xs.station_name AS exit_station_name,
        pm.fare
    FROM Passenger_movement pm
    INNER JOIN Station es ON pm.entry_station_id = es.station_id
    LEFT  JOIN Station xs ON pm.exit_station_id  = xs.station_id
    WHERE pm.passenger_id = @passenger_id
    ORDER BY pm.entry_time DESC;
END;
GO

CREATE PROCEDURE sp_SearchNextTrainAtStation
    @station_id INT
AS
BEGIN
    SELECT TOP 5
        s.arrival_time, s.departure_time, t.train_name, r.route_name
    FROM Schedule s
    INNER JOIN Train t ON s.train_id = t.train_id
    INNER JOIN Route r ON t.route_id = r.route_id
    WHERE s.station_id = @station_id AND s.arrival_time >= CAST(GETDATE() AS TIME)
    ORDER BY s.arrival_time ASC;
END;
GO

CREATE PROCEDURE sp_DeployTrain
    @train_id INT,
    @status   VARCHAR(50)
AS
BEGIN
    INSERT INTO Train_status (train_id, update_time, status, date)
    VALUES (@train_id, GETDATE(), @status, CAST(GETDATE() AS DATE));
END;
GO

CREATE PROCEDURE sp_RechargeWallet
    @passenger_id  INT,
    @amount        FLOAT,
    @payment_method VARCHAR(50)
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
            UPDATE Passenger SET account_balance = account_balance + @amount WHERE passenger_id = @passenger_id;
            INSERT INTO Recharge_Transaction (passenger_id, amount, recharge_date, payment_method)
            VALUES (@passenger_id, @amount, GETDATE(), @payment_method);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE PROCEDURE sp_PayFine
    @fine_id INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @p_id INT, @amount FLOAT;
    SELECT @p_id = passenger_id, @amount = amount FROM Fine WHERE fine_id = @fine_id;
    
    BEGIN TRANSACTION;
    BEGIN TRY
        IF (SELECT account_balance FROM Passenger WHERE passenger_id = @p_id) < @amount
            RAISERROR('Insufficient balance.', 16, 1);
        
        UPDATE Passenger SET account_balance = account_balance - @amount WHERE passenger_id = @p_id;
        UPDATE Fine SET status = 'Paid' WHERE fine_id = @fine_id;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE PROCEDURE sp_MonthlyPassengerReport
    @year  INT,
    @month INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.name                              AS passenger_name,
        COUNT(pm.passenger_movement_id)     AS total_trips,
        ISNULL(SUM(pm.fare), 0)             AS total_spent,
        ISNULL(AVG(pm.fare), 0)             AS avg_fare_per_trip,
        COUNT(f.fine_id)                    AS fines_incurred,
        dbo.fn_GetPassengerTier(p.passenger_id) AS loyalty_tier
    FROM Passenger p
    LEFT JOIN Passenger_movement pm
        ON p.passenger_id = pm.passenger_id
        AND YEAR(pm.entry_time) = @year
        AND MONTH(pm.entry_time) = @month
        AND pm.exit_time IS NOT NULL
    LEFT JOIN Fine f
        ON p.passenger_id = f.passenger_id
        AND YEAR(f.date) = @year
        AND MONTH(f.date) = @month
    WHERE p.role = 'passenger'
    GROUP BY p.passenger_id, p.name
    ORDER BY total_spent DESC;
END;
GO


----------------------------------------------------------------------------------
-- 5. TRIGGERS
----------------------------------------------------------------------------------

CREATE TRIGGER trg_SystemCapacityCheck
ON Passenger_movement
AFTER INSERT
AS
BEGIN
    DECLARE @active_passengers INT;
    DECLARE @train_capacity INT;
    DECLARE @max_capacity INT;
    SELECT @train_capacity = ISNULL(SUM(t.capacity), 0)
    FROM Train t
    INNER JOIN vw_LatestTrainStatus latest ON t.train_id = latest.train_id
    WHERE latest.status IN ('Running', 'At Station', 'Departing');

    SET @max_capacity = 5000 + @train_capacity;

    SELECT @active_passengers = COUNT(*) FROM Passenger_movement WHERE exit_time IS NULL;

    IF @active_passengers >= @max_capacity
    BEGIN
        RAISERROR('System is currently at maximum capacity. Entry denied.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO

CREATE TRIGGER trg_AuditPassengerBalance
ON Passenger
AFTER UPDATE
AS
BEGIN
    DECLARE @action VARCHAR(20) = 'UPDATE';
    DECLARE @old_val VARCHAR(MAX), @new_val VARCHAR(MAX);

    SET @old_val = (SELECT * FROM deleted FOR JSON PATH);
    SET @new_val = (SELECT * FROM inserted FOR JSON PATH);

    INSERT INTO Audit_Log (table_name, action_type, old_value, new_value)
    VALUES ('Passenger', @action, ISNULL(@old_val, 'N/A'), ISNULL(@new_val, 'N/A'));
END;
GO

CREATE TRIGGER trg_AuditEmployeeChanges
ON Employee
AFTER UPDATE, DELETE
AS
BEGIN
    DECLARE @action VARCHAR(20) = CASE WHEN EXISTS(SELECT * FROM inserted) THEN 'UPDATE' ELSE 'DELETE' END;
    DECLARE @old_val VARCHAR(MAX), @new_val VARCHAR(MAX);

    SET @old_val = (SELECT * FROM deleted FOR JSON PATH);
    SET @new_val = (SELECT * FROM inserted FOR JSON PATH);

    INSERT INTO Audit_Log (table_name, action_type, old_value, new_value)
    VALUES ('Employee', @action, ISNULL(@old_val, 'N/A'), ISNULL(@new_val, 'N/A'));
END;
GO

----------------------------------------------------------------------------------
-- 6. SEED DATA
----------------------------------------------------------------------------------
INSERT INTO Route (route_name, total_distance) VALUES
    ('Uttara-Motijheel', 20.1),
    ('Mirpur-Farmgate', 10.5);

INSERT INTO Station (station_name, location) VALUES
    ('Uttara North', 'Uttara'), ('Pallabi', 'Mirpur'), ('Mirpur 10', 'Mirpur'),
    ('Agargaon', 'Agargaon'), ('Farmgate', 'Tejgaon'), ('Motijheel', 'Motijheel');

-- Route 1: all 6 stations
INSERT INTO Route_station (route_id, station_id, station_order, distance_from_start) VALUES
    (1,1,1,0.0),(1,2,2,4.5),(1,3,3,7.0),(1,4,4,11.5),(1,5,5,14.0),(1,6,6,20.1);

-- Route 2: Mirpur 10 (station 3) -> Farmgate (station 5). NEW: Enables transfer feature.
INSERT INTO Route_station (route_id, station_id, station_order, distance_from_start) VALUES
    (2,3,1,0.0),(2,5,2,7.0);

INSERT INTO Train (train_name, capacity, route_id) VALUES
    ('Red Line 01', 1000, 1),
    ('Red Line 02', 1000, 1),
    ('Green Line 01', 800, 2);

INSERT INTO Schedule (train_id, station_id, arrival_time, departure_time) VALUES
    (1,1,'23:00:00','23:05:00'),(1,2,'23:15:00','23:20:00'),(1,3,'23:30:00','23:35:00'),
    (2,4,'23:40:00','23:45:00'),(2,5,'23:50:00','23:55:00'),(2,6,'23:59:00','23:59:59');

INSERT INTO Passenger (name, password, nid, account_balance, role) VALUES
    ('System Admin', '$2b$10$pYM6MdLeiNqSVe82sm7JcO1MFandcjG5zY8OMXzIDo3K6EUFuVaz.', 'admin', 99999.0, 'admin'),
    ('John Doe', '$2b$10$pYM6MdLeiNqSVe82sm7JcO1MFandcjG5zY8OMXzIDo3K6EUFuVaz.', 'user', 500.0, 'passenger');

INSERT INTO Fine (passenger_id, reason, date, amount, status) VALUES
    (2, 'Lost Ticket 2 Months Ago', DATEADD(day,-45,GETDATE()), 200.0, 'Unpaid'),
    (2, 'Littering at Station',     GETDATE(),                  100.0, 'Unpaid');

INSERT INTO Employee (name, nid, role, shift, station_id, train_id) VALUES
    ('Karim', '111', 'Station Master', 'Morning', 3, NULL),
    ('Rahim', '222', 'Loco Master',    'Night',   NULL, 1);

INSERT INTO Train_status (train_id, update_time, status, date) VALUES
    (1, DATEADD(minute,-10,GETDATE()), 'Running', CAST(GETDATE() AS DATE)),
    (2, DATEADD(minute,-5, GETDATE()), 'Delayed', CAST(GETDATE() AS DATE));

-- Completed journey (for history/revenue demo)
INSERT INTO Passenger_movement (passenger_id, entry_station_id, exit_station_id, entry_time, exit_time, fare)
VALUES (2, 1, 4, DATEADD(hour,-3,GETDATE()), DATEADD(hour,-2,GETDATE()), 135.0);

-- Active journey (currently in transit)
INSERT INTO Passenger_movement (passenger_id, entry_station_id, entry_time)
VALUES (2, 4, DATEADD(hour,-1,GETDATE()));

GO