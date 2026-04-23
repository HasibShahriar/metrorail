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

CREATE TABLE Coach (
    coach_id INT IDENTITY(1,1) PRIMARY KEY,
    train_id INT,
    coach_number VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 200,
    status VARCHAR(20) DEFAULT 'Active',
    is_reserved BIT DEFAULT 0,
    created_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (train_id) REFERENCES Train(train_id),
    CONSTRAINT chk_coach_status CHECK (status IN ('Active','Faulty','Reserved','Replaced'))
);

CREATE TABLE CoachHistory (
    history_id INT IDENTITY(1,1) PRIMARY KEY,
    coach_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    notes VARCHAR(200),
    action_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (coach_id) REFERENCES Coach(coach_id)
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
    role VARCHAR(20) DEFAULT 'Passenger'
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
    penalty_count INT DEFAULT 0,
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



CREATE TABLE Fare_Matrix (
    from_station_id INT,
    to_station_id   INT,
    fare            FLOAT,
    PRIMARY KEY (from_station_id, to_station_id),
    FOREIGN KEY (from_station_id) REFERENCES Station(station_id),
    FOREIGN KEY (to_station_id)   REFERENCES Station(station_id)
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
CREATE NONCLUSTERED INDEX IX_Coach_Train ON Coach(train_id, status);
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
    DECLARE @fare FLOAT;
    SELECT @fare = fare FROM Fare_Matrix
    WHERE from_station_id = @entry_station_id AND to_station_id = @exit_station_id;
    RETURN ISNULL(@fare, 0.0);
END;
GO

DROP FUNCTION IF EXISTS dbo.fn_RouteEstimator;
GO

CREATE FUNCTION fn_RouteEstimator (@from_id INT, @to_id INT)
RETURNS @ResultData TABLE (Distance FLOAT, EstimatedFare FLOAT, EstimatedMinutes INT, Path NVARCHAR(MAX))
AS
BEGIN
    DECLARE @start_dist FLOAT = 0.0;
    DECLARE @end_dist   FLOAT = 0.0;
    DECLARE @path NVARCHAR(MAX) = '';
    DECLARE @route_id INT;
    
    -- Determine direction: if from_id > to_id, going backward (route 2), else forward (route 1)
    IF @from_id < @to_id
        SET @route_id = 1;
    ELSE
        SET @route_id = 2;
    
    -- Get distances
    SELECT @start_dist = distance_from_start FROM Route_station WHERE route_id = @route_id AND station_id = @from_id;
    SELECT @end_dist   = distance_from_start FROM Route_station WHERE route_id = @route_id AND station_id = @to_id;
    
    -- Build path as comma-separated station IDs in order
    SELECT @path = STRING_AGG(CAST(station_id AS NVARCHAR(10)), ',') WITHIN GROUP (ORDER BY station_order)
    FROM Route_station 
    WHERE route_id = @route_id 
      AND station_order >= (SELECT station_order FROM Route_station WHERE route_id = @route_id AND station_id = @from_id)
      AND station_order <= (SELECT station_order FROM Route_station WHERE route_id = @route_id AND station_id = @to_id);
    
    INSERT INTO @ResultData
    VALUES (
        ABS(@end_dist - @start_dist),
        dbo.fn_CalculateFare(@from_id, @to_id),
        CAST(ABS(@end_dist - @start_dist) * 2.5 AS INT),
        @path
    );
    
    RETURN;
END;
GO

CREATE FUNCTION fn_GetPassengerTier (@passenger_id INT) RETURNS VARCHAR(10)
AS
BEGIN
    DECLARE @total_spent FLOAT, @passenger_name VARCHAR(100);
    
    SELECT @passenger_name = name FROM Passenger WHERE passenger_id = @passenger_id;
    
    IF @passenger_name = 'Dhrubo'
        RETURN 'Gold';
    
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

        DECLARE @total_fines FLOAT, @balance FLOAT;
        SELECT @total_fines = ISNULL(SUM(amount), 0) FROM Fine WHERE passenger_id = @passenger_id AND status = 'Unpaid';
        
        IF @total_fines > 1000
            RAISERROR('Entry denied: Outstanding fines exceed ৳1000.', 16, 1);

        SELECT @balance = account_balance FROM Passenger WHERE passenger_id = @passenger_id;
        IF @balance < 100
            RAISERROR('Entry denied: Minimum balance of ৳100 required to enter.', 16, 1);

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

        DECLARE @entry_station_id INT, @passenger_id INT, @base_fare FLOAT, @final_fare FLOAT, @discount_pct FLOAT = 0;
        DECLARE @current_balance FLOAT, @tier VARCHAR(10);
        DECLARE @entry_station_name VARCHAR(100), @exit_station_name VARCHAR(100);
        DECLARE @distance FLOAT, @entry_time DATETIME, @route_id INT, @start_dist FLOAT, @end_dist FLOAT;

        SELECT 
            @entry_station_id = pm.entry_station_id,
            @passenger_id = pm.passenger_id,
            @entry_time = pm.entry_time
        FROM Passenger_movement pm
        WHERE passenger_movement_id = @movement_id AND exit_time IS NULL;

        IF @passenger_id IS NULL
            RAISERROR('Movement record not found or already checked out.', 16, 1);

        -- Get station names
        SELECT @entry_station_name = station_name FROM Station WHERE station_id = @entry_station_id;
        SELECT @exit_station_name  = station_name FROM Station WHERE station_id = @exit_station_id;

        -- Find route_id where both stations exist
        SELECT TOP 1 @route_id = r1.route_id
        FROM Route_station r1 INNER JOIN Route_station r2 ON r1.route_id = r2.route_id
        WHERE r1.station_id = @entry_station_id AND r2.station_id = @exit_station_id;

        -- Calculate distance using route_id
        IF @route_id IS NOT NULL
        BEGIN
            SELECT @start_dist = distance_from_start FROM Route_station WHERE route_id = @route_id AND station_id = @entry_station_id;
            SELECT @end_dist   = distance_from_start FROM Route_station WHERE route_id = @route_id AND station_id = @exit_station_id;
            SET @distance = ABS(@end_dist - @start_dist);
        END
        ELSE
            SET @distance = 0;

        SET @base_fare = dbo.fn_CalculateFare(@entry_station_id, @exit_station_id);

        -- Apply loyalty discount
        SET @tier = dbo.fn_GetPassengerTier(@passenger_id);
        IF @tier = 'Gold'   SET @discount_pct = 10;
        IF @tier = 'Silver' SET @discount_pct = 5;

        SET @final_fare = @base_fare - (@base_fare * @discount_pct / 100);

        -- Update movement record
        UPDATE Passenger_movement
        SET exit_station_id = @exit_station_id, exit_time = GETDATE(), fare = @final_fare
        WHERE passenger_movement_id = @movement_id;

        SELECT @current_balance = account_balance FROM Passenger WHERE passenger_id = @passenger_id;

        IF (@current_balance - @final_fare) < 0
        BEGIN
            INSERT INTO Fine (passenger_id, reason, date, amount, status)
            VALUES (@passenger_id,
                    'Insufficient balance on exit (owed fare: ' + CAST(CAST(@final_fare AS INT) AS VARCHAR) + ' tk)',
                    CAST(GETDATE() AS DATE), 500.0, 'Unpaid');
        END
        ELSE
        BEGIN
            UPDATE Passenger
            SET account_balance = account_balance - @final_fare
            WHERE passenger_id = @passenger_id;
        END

        -- Return receipt data
        SELECT
            @entry_station_id                         AS entry_station_id,
            @entry_station_name                       AS entry_station_name,
            @exit_station_id                          AS exit_station_id,
            @exit_station_name                        AS exit_station_name,
            @distance                                 AS distance,
            @base_fare                                AS base_fare,
            @discount_pct                             AS discount_pct,
            @final_fare                               AS final_fare,
            @tier                                     AS loyalty_tier,
            (SELECT account_balance FROM Passenger WHERE passenger_id = @passenger_id) AS new_balance,
            (@distance * 2.5) + (2 * ABS(@exit_station_id - @entry_station_id)) AS duration_minutes;

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
IF OBJECT_ID('sp_SearchNextTrainAtStation') IS NOT NULL
    DROP PROCEDURE sp_SearchNextTrainAtStation;
GO

CREATE PROCEDURE sp_SearchNextTrainAtStation
    @station_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 5
        s.schedule_id,
        s.arrival_time,
        s.departure_time,
        t.train_name,
        r.route_name
    FROM Schedule s
    INNER JOIN Train t ON s.train_id   = t.train_id
    INNER JOIN Route r ON t.route_id   = r.route_id
    WHERE s.station_id = @station_id
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

CREATE PROCEDURE sp_SwapCoach
    @faulty_coach_id INT,
    @reserved_coach_id INT,
    @new_train_id INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        UPDATE Coach SET status = 'Replaced', is_reserved = 0 WHERE coach_id = @faulty_coach_id;
        INSERT INTO CoachHistory (coach_id, action, old_status, new_status, notes)
        VALUES (@faulty_coach_id, 'Replaced', 'Faulty', 'Replaced', 'Replaced with coach ' + CAST(@reserved_coach_id AS VARCHAR));
        
        UPDATE Coach SET train_id = @new_train_id, status = 'Active', is_reserved = 0 WHERE coach_id = @reserved_coach_id;
        INSERT INTO CoachHistory (coach_id, action, old_status, new_status, notes)
        VALUES (@reserved_coach_id, 'Deployed', 'Reserved', 'Active', 'Deployed to train ' + CAST(@new_train_id AS VARCHAR));
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE PROCEDURE sp_MarkCoachFaulty
    @coach_id INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        UPDATE Coach SET status = 'Faulty' WHERE coach_id = @coach_id;
        INSERT INTO CoachHistory (coach_id, action, old_status, new_status, notes)
        VALUES (@coach_id, 'Marked Faulty', 'Active', 'Faulty', 'Coach marked as faulty for maintenance');
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE PROCEDURE sp_IssueFine
    @passenger_id INT,
    @reason VARCHAR(200),
    @amount FLOAT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT INTO Fine (passenger_id, reason, date, amount, status)
        VALUES (@passenger_id, @reason, CAST(GETDATE() AS DATE), @amount, 'Unpaid');
        SELECT SCOPE_IDENTITY() AS fine_id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END;
GO

CREATE PROCEDURE sp_WaiveFine
    @fine_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM Fine WHERE fine_id = @fine_id AND status = 'Unpaid')
            RAISERROR('Fine not found or already resolved.', 16, 1);
        UPDATE Fine SET status = 'Waived' WHERE fine_id = @fine_id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
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

-- Routes
INSERT INTO Route (route_name, total_distance) VALUES
    ('Uttara North-Kamlapur', 21.26),
    ('Kamlapur-Uttara North', 21.26);

INSERT INTO Station (station_name, location) VALUES
    ('Uttara North',          'Uttara'),
    ('Uttara Center',         'Uttara'),
    ('Uttara South',          'Uttara'),
    ('Pallabi',               'Mirpur'),
    ('Mirpur 11',             'Mirpur'),
    ('Mirpur 10',             'Mirpur'),
    ('Kazipara',              'Mirpur'),
    ('Shewrapara',            'Mirpur'),
    ('Agargaon',              'Agargaon'),
    ('Bijoy Sarani',          'Tejgaon'),
    ('Farmgate',              'Tejgaon'),
    ('Karwan Bazar',          'Tejgaon'),
    ('Shahbag',               'Shahbag'),
    ('Dhaka University',      'Shahbag'),
    ('Bangladesh Secretariat','Motijheel'),
    ('Motijheel',             'Motijheel'),
    ('Kamlapur',              'Motijheel');


INSERT INTO Fare_Matrix (from_station_id, to_station_id, fare) VALUES
-- From Uttara North (1)
(1,1,0),(1,2,20),(1,3,20),(1,4,30),(1,5,30),(1,6,40),(1,7,40),(1,8,60),(1,9,60),(1,10,60),(1,11,70),(1,12,80),(1,13,80),(1,14,90),(1,15,90),(1,16,100),(1,17,100),
-- From Uttara Center (2)
(2,1,20),(2,2,0),(2,3,20),(2,4,20),(2,5,30),(2,6,30),(2,7,40),(2,8,40),(2,9,50),(2,10,60),(2,11,60),(2,12,70),(2,13,70),(2,14,80),(2,15,90),(2,16,90),(2,17,100),
-- From Uttara South (3)
(3,1,20),(3,2,20),(3,3,0),(3,4,20),(3,5,20),(3,6,30),(3,7,30),(3,8,40),(3,9,40),(3,10,50),(3,11,60),(3,12,60),(3,13,70),(3,14,70),(3,15,80),(3,16,90),(3,17,90),
-- From Pallabi (4)
(4,1,30),(4,2,20),(4,3,20),(4,4,0),(4,5,20),(4,6,20),(4,7,20),(4,8,30),(4,9,30),(4,10,40),(4,11,50),(4,12,50),(4,13,60),(4,14,60),(4,15,70),(4,16,80),(4,17,80),
-- From Mirpur 11 (5)
(5,1,30),(5,2,30),(5,3,20),(5,4,20),(5,5,0),(5,6,20),(5,7,20),(5,8,20),(5,9,30),(5,10,40),(5,11,40),(5,12,50),(5,13,60),(5,14,60),(5,15,70),(5,16,70),(5,17,80),
-- From Mirpur 10 (6)
(6,1,40),(6,2,30),(6,3,30),(6,4,20),(6,5,20),(6,6,0),(6,7,20),(6,8,20),(6,9,20),(6,10,30),(6,11,30),(6,12,40),(6,13,50),(6,14,50),(6,15,60),(6,16,60),(6,17,70),
-- From Kazipara (7)
(7,1,40),(7,2,40),(7,3,30),(7,4,20),(7,5,20),(7,6,20),(7,7,0),(7,8,20),(7,9,20),(7,10,20),(7,11,30),(7,12,40),(7,13,40),(7,14,50),(7,15,50),(7,16,60),(7,17,70),
-- From Shewrapara (8)
(8,1,60),(8,2,40),(8,3,40),(8,4,30),(8,5,20),(8,6,20),(8,7,20),(8,8,0),(8,9,20),(8,10,20),(8,11,20),(8,12,30),(8,13,40),(8,14,40),(8,15,50),(8,16,50),(8,17,60),
-- From Agargaon (9)
(9,1,60),(9,2,50),(9,3,40),(9,4,30),(9,5,30),(9,6,20),(9,7,20),(9,8,20),(9,9,0),(9,10,20),(9,11,20),(9,12,20),(9,13,30),(9,14,30),(9,15,40),(9,16,50),(9,17,50),
-- From Bijoy Sarani (10)
(10,1,60),(10,2,60),(10,3,50),(10,4,40),(10,5,40),(10,6,30),(10,7,20),(10,8,20),(10,9,20),(10,10,0),(10,11,20),(10,12,20),(10,13,20),(10,14,30),(10,15,40),(10,16,40),(10,17,50),
-- From Farmgate (11)
(11,1,70),(11,2,60),(11,3,60),(11,4,50),(11,5,40),(11,6,30),(11,7,30),(11,8,20),(11,9,20),(11,10,20),(11,11,0),(11,12,20),(11,13,20),(11,14,20),(11,15,30),(11,16,30),(11,17,40),
-- From Karwan Bazar (12)
(12,1,80),(12,2,70),(12,3,60),(12,4,50),(12,5,50),(12,6,40),(12,7,40),(12,8,30),(12,9,20),(12,10,20),(12,11,20),(12,12,0),(12,13,20),(12,14,20),(12,15,20),(12,16,30),(12,17,30),
-- From Shahbag (13)
(13,1,80),(13,2,70),(13,3,70),(13,4,60),(13,5,50),(13,6,50),(13,7,40),(13,8,40),(13,9,30),(13,10,20),(13,11,20),(13,12,20),(13,13,0),(13,14,20),(13,15,20),(13,16,20),(13,17,30),
-- From Dhaka University (14)
(14,1,90),(14,2,80),(14,3,70),(14,4,60),(14,5,60),(14,6,50),(14,7,50),(14,8,40),(14,9,30),(14,10,30),(14,11,20),(14,12,20),(14,13,20),(14,14,0),(14,15,20),(14,16,20),(14,17,20),
-- From Bangladesh Secretariat (15)
(15,1,90),(15,2,90),(15,3,80),(15,4,70),(15,5,70),(15,6,60),(15,7,50),(15,8,50),(15,9,40),(15,10,40),(15,11,30),(15,12,20),(15,13,20),(15,14,20),(15,15,0),(15,16,20),(15,17,20),
-- From Motijheel (16)
(16,1,100),(16,2,90),(16,3,90),(16,4,80),(16,5,70),(16,6,60),(16,7,60),(16,8,50),(16,9,50),(16,10,40),(16,11,30),(16,12,30),(16,13,20),(16,14,20),(16,15,20),(16,16,0),(16,17,20),
-- From Kamlapur (17)
(17,1,100),(17,2,100),(17,3,90),(17,4,80),(17,5,80),(17,6,70),(17,7,70),(17,8,60),(17,9,50),(17,10,50),(17,11,40),(17,12,30),(17,13,30),(17,14,20),(17,15,20),(17,16,20),(17,17,0);


INSERT INTO Route_station (route_id, station_id, station_order, distance_from_start) VALUES
    (1,  1,  1,  0.00),   -- Uttara North
    (1,  2,  2,  1.20),   -- Uttara Center
    (1,  3,  3,  2.40),   -- Uttara South
    (1,  4,  4,  4.00),   -- Pallabi
    (1,  5,  5,  5.50),   -- Mirpur 11
    (1,  6,  6,  7.00),   -- Mirpur 10
    (1,  7,  7,  8.50),   -- Kazipara
    (1,  8,  8,  9.80),   -- Shewrapara
    (1,  9,  9, 11.20),   -- Agargaon
    (1, 10, 10, 12.40),   -- Bijoy Sarani
    (1, 11, 11, 13.50),   -- Farmgate
    (1, 12, 12, 14.60),   -- Karwan Bazar
    (1, 13, 13, 15.60),   -- Shahbag
    (1, 14, 14, 16.60),   -- Dhaka University
    (1, 15, 15, 17.80),   -- Bangladesh Secretariat
    (1, 16, 16, 19.00),   -- Motijheel
    (1, 17, 17, 21.26);   -- Kamlapur

-- Route 2: Kamlapur to Uttara North (reverse)
INSERT INTO Route_station (route_id, station_id, station_order, distance_from_start) VALUES
    (2, 17,  1,  0.00),   -- Kamlapur
    (2, 16,  2,  2.26),   -- Motijheel
    (2, 15,  3,  3.46),   -- Bangladesh Secretariat
    (2, 14,  4,  4.66),   -- Dhaka University
    (2, 13,  5,  5.66),   -- Shahbag
    (2, 12,  6,  6.66),   -- Karwan Bazar
    (2, 11,  7,  7.76),   -- Farmgate
    (2, 10,  8,  8.86),   -- Bijoy Sarani
    (2,  9,  9, 10.06),   -- Agargaon
    (2,  8, 10, 11.46),   -- Shewrapara
    (2,  7, 11, 12.76),   -- Kazipara
    (2,  6, 12, 14.26),   -- Mirpur 10
    (2,  5, 13, 15.76),   -- Mirpur 11
    (2,  4, 14, 17.26),   -- Pallabi
    (2,  3, 15, 18.86),   -- Uttara South
    (2,  2, 16, 20.06),   -- Uttara Center
    (2,  1, 17, 21.26);   -- Uttara North


INSERT INTO Train (train_name, capacity, route_id) VALUES
    ('Red Line 01', 1000, 1),
    ('Red Line 02', 1000, 1),
    ('Red Line 03', 800,  1),
    ('Green Line 01', 1000, 2),
    ('Green Line 02', 1000, 2),
    ('Green Line 03', 800,  2);


-- Red Line 01 — starts 06:00
INSERT INTO Schedule (train_id, station_id, arrival_time, departure_time) VALUES
(1,  1, '06:00:00', '06:02:00'),
(1,  2, '06:05:00', '06:07:00'),
(1,  3, '06:10:00', '06:12:00'),
(1,  4, '06:16:00', '06:18:00'),
(1,  5, '06:21:00', '06:23:00'),
(1,  6, '06:27:00', '06:29:00'),
(1,  7, '06:33:00', '06:35:00'),
(1,  8, '06:39:00', '06:41:00'),
(1,  9, '06:45:00', '06:47:00'),
(1, 10, '06:50:00', '06:52:00'),
(1, 11, '06:54:00', '06:56:00'),
(1, 12, '06:59:00', '07:01:00'),
(1, 13, '07:04:00', '07:06:00'),
(1, 14, '07:06:00', '07:08:00'),
(1, 15, '07:11:00', '07:13:00'),
(1, 16, '07:16:00', '07:18:00'),
(1, 17, '07:24:00', '07:26:00');

-- Red Line 02 — starts 07:00
INSERT INTO Schedule (train_id, station_id, arrival_time, departure_time) VALUES
(2,  1, '07:00:00', '07:02:00'),
(2,  2, '07:05:00', '07:07:00'),
(2,  3, '07:10:00', '07:12:00'),
(2,  4, '07:16:00', '07:18:00'),
(2,  5, '07:21:00', '07:23:00'),
(2,  6, '07:27:00', '07:29:00'),
(2,  7, '07:33:00', '07:35:00'),
(2,  8, '07:39:00', '07:41:00'),
(2,  9, '07:45:00', '07:47:00'),
(2, 10, '07:50:00', '07:52:00'),
(2, 11, '07:54:00', '07:56:00'),
(2, 12, '07:59:00', '08:01:00'),
(2, 13, '08:04:00', '08:06:00'),
(2, 14, '08:06:00', '08:08:00'),
(2, 15, '08:11:00', '08:13:00'),
(2, 16, '08:16:00', '08:18:00'),
(2, 17, '08:24:00', '08:26:00');

-- Red Line 03 — starts 08:00
INSERT INTO Schedule (train_id, station_id, arrival_time, departure_time) VALUES
(3,  1, '08:00:00', '08:02:00'),
(3,  2, '08:05:00', '08:07:00'),
(3,  3, '08:10:00', '08:12:00'),
(3,  4, '08:16:00', '08:18:00'),
(3,  5, '08:21:00', '08:23:00'),
(3,  6, '08:27:00', '08:29:00'),
(3,  7, '08:33:00', '08:35:00'),
(3,  8, '08:39:00', '08:41:00'),
(3,  9, '08:45:00', '08:47:00'),
(3, 10, '08:50:00', '08:52:00'),
(3, 11, '08:54:00', '08:56:00'),
(3, 12, '08:59:00', '09:01:00'),
(3, 13, '09:04:00', '09:06:00'),
(3, 14, '09:06:00', '09:08:00'),
(3, 15, '09:11:00', '09:13:00'),
(3, 16, '09:16:00', '09:18:00'),
(3, 17, '09:24:00', '09:26:00');

-- Green Line 01 — starts from Kamlapur at 06:00
INSERT INTO Schedule (train_id, station_id, arrival_time, departure_time) VALUES
(4, 17, '06:00:00', '06:02:00'),
(4, 16, '06:03:00', '06:05:00'),
(4, 15, '06:05:00', '06:07:00'),
(4, 14, '06:07:00', '06:09:00'),
(4, 13, '06:09:00', '06:11:00'),
(4, 12, '06:11:00', '06:13:00'),
(4, 11, '06:13:00', '06:15:00'),
(4, 10, '06:15:00', '06:17:00'),
(4,  9, '06:17:00', '06:19:00'),
(4,  8, '06:21:00', '06:23:00'),
(4,  7, '06:24:00', '06:26:00'),
(4,  6, '06:28:00', '06:30:00'),
(4,  5, '06:31:00', '06:33:00'),
(4,  4, '06:34:00', '06:36:00'),
(4,  3, '06:38:00', '06:40:00'),
(4,  2, '06:42:00', '06:44:00'),
(4,  1, '06:46:00', '06:48:00');

-- Green Line 02 — starts from Kamlapur at 07:00
INSERT INTO Schedule (train_id, station_id, arrival_time, departure_time) VALUES
(5, 17, '07:00:00', '07:02:00'),
(5, 16, '07:03:00', '07:05:00'),
(5, 15, '07:05:00', '07:07:00'),
(5, 14, '07:07:00', '07:09:00'),
(5, 13, '07:09:00', '07:11:00'),
(5, 12, '07:11:00', '07:13:00'),
(5, 11, '07:13:00', '07:15:00'),
(5, 10, '07:15:00', '07:17:00'),
(5,  9, '07:17:00', '07:19:00'),
(5,  8, '07:21:00', '07:23:00'),
(5,  7, '07:24:00', '07:26:00'),
(5,  6, '07:28:00', '07:30:00'),
(5,  5, '07:31:00', '07:33:00'),
(5,  4, '07:34:00', '07:36:00'),
(5,  3, '07:38:00', '07:40:00'),
(5,  2, '07:42:00', '07:44:00'),
(5,  1, '07:46:00', '07:48:00');


INSERT INTO Passenger (name, password, nid, account_balance, role) VALUES
    ('System Admin', '$2b$10$pYM6MdLeiNqSVe82sm7JcO1MFandcjG5zY8OMXzIDo3K6EUFuVaz.', 'admin', 10000.0, 'Admin'),
    ('John Doe', '$2b$10$pYM6MdLeiNqSVe82sm7JcO1MFandcjG5zY8OMXzIDo3K6EUFuVaz.', 'user', 500.0, 'Passenger'),
    ('Oditto', '$2b$10$pYM6MdLeiNqSVe82sm7JcO1MFandcjG5zY8OMXzIDo3K6EUFuVaz.', 'oditto', 500.0, 'Passenger'),
    ('Akash', '$2b$10$pYM6MdLeiNqSVe82sm7JcO1MFandcjG5zY8OMXzIDo3K6EUFuVaz.', 'akash', 1000.0, 'Passenger'),
    ('Dhrubo', '$2b$10$pYM6MdLeiNqSVe82sm7JcO1MFandcjG5zY8OMXzIDo3K6EUFuVaz.', 'dhrubo', 1500.0, 'Passenger');


INSERT INTO Passenger_movement (passenger_id, entry_station_id, exit_station_id, entry_time, exit_time, fare) VALUES
    (2, 1, 5, DATEADD(day,-10,GETDATE()), DATEADD(day,-10,GETDATE()) + '02:45:00', 30.0),
    (2, 3, 8, DATEADD(day,-8,GETDATE()),  DATEADD(day,-8,GETDATE()) + '01:30:00',  40.0),
    (2, 2, 11, DATEADD(day,-5,GETDATE()), DATEADD(day,-5,GETDATE()) + '01:15:00', 60.0),
    (3, 1, 6, DATEADD(day,-12,GETDATE()), DATEADD(day,-12,GETDATE()) + '01:00:00', 40.0),
    (3, 4, 9, DATEADD(day,-7,GETDATE()),  DATEADD(day,-7,GETDATE()) + '02:30:00',  30.0),
    (3, 5, 12, DATEADD(day,-3,GETDATE()), DATEADD(day,-3,GETDATE()) + '01:45:00', 50.0),
    (4, 2, 7, DATEADD(day,-14,GETDATE()), DATEADD(day,-14,GETDATE()) + '02:00:00', 40.0),
    (4, 6, 10, DATEADD(day,-9,GETDATE()), DATEADD(day,-9,GETDATE()) + '01:20:00',  30.0),
    (4, 1, 13, DATEADD(day,-4,GETDATE()), DATEADD(day,-4,GETDATE()) + '02:15:00', 80.0),
    (5, 3, 8, DATEADD(day,-11,GETDATE()), DATEADD(day,-11,GETDATE()) + '01:50:00', 40.0),
    (5, 7, 11, DATEADD(day,-6,GETDATE()), DATEADD(day,-6,GETDATE()) + '02:10:00', 30.0);

INSERT INTO Fine (passenger_id, reason, date, amount, status) VALUES
    (2, 'Lost Ticket 2 Months Ago', DATEADD(day,-45,GETDATE()), 200.0, 'Unpaid'),
    (2, 'Overstaying at the Station', GETDATE(),                 100.0, 'Unpaid'),
    (3, 'Traveling Without Valid Ticket', DATEADD(day,-20,GETDATE()), 150.0, 'Unpaid'),
    (3, 'Fare Evasion',               DATEADD(day,-10,GETDATE()), 250.0, 'Paid'),
    (4, 'Disrupting Other Passengers', DATEADD(day,-25,GETDATE()), 180.0, 'Unpaid'),
    (4, 'Not Following Safety Rules',  DATEADD(day,-15,GETDATE()), 120.0, 'Paid'),
    (5, 'Overstaying at the Station',  DATEADD(day,-30,GETDATE()), 100.0, 'Unpaid'),
    (5, 'Damaging Train Property',     DATEADD(day,-5,GETDATE()),  300.0, 'Paid');

INSERT INTO Employee (name, nid, role, shift, station_id, train_id) VALUES
    ('Karim', '111', 'Station Master', 'Morning', 3, NULL),
    ('Rahim', '222', 'Loco Master',    'Night',   NULL, 1),
    ('Sajid', '333', 'Station Master', 'Evening', 9, NULL);

INSERT INTO Train_status (train_id, update_time, status, date) VALUES
    (1, DATEADD(minute,-10, GETDATE()), 'Running', CAST(GETDATE() AS DATE)),
    (2, DATEADD(minute,-5,  GETDATE()), 'Delayed', CAST(GETDATE() AS DATE)),
    (3, DATEADD(minute,-2,  GETDATE()), 'Standby', CAST(GETDATE() AS DATE)),
    (4, DATEADD(minute,-8,  GETDATE()), 'Running', CAST(GETDATE() AS DATE)),
    (5, DATEADD(minute,-3,  GETDATE()), 'Running', CAST(GETDATE() AS DATE)),
    (6, DATEADD(minute,-1,  GETDATE()), 'Standby', CAST(GETDATE() AS DATE));

INSERT INTO Coach (train_id, coach_number, capacity, status, is_reserved) VALUES
    (1, 'A1', 200, 'Active', 0), (1, 'A2', 200, 'Active', 0), (1, 'A3', 200, 'Active', 0),
    (1, 'A4', 200, 'Active', 0), (1, 'A5', 200, 'Faulty', 0), (1, 'A6', 200, 'Active', 0),
    (2, 'B1', 200, 'Active', 0), (2, 'B2', 200, 'Active', 0), (2, 'B3', 200, 'Active', 0),
    (2, 'B4', 200, 'Active', 0), (2, 'B5', 200, 'Active', 0), (2, 'B6', 200, 'Faulty', 0),
    (3, 'C1', 200, 'Active', 0), (3, 'C2', 200, 'Active', 0), (3, 'C3', 200, 'Active', 0),
    (3, 'C4', 200, 'Active', 0), (3, 'C5', 200, 'Faulty', 0),
    (4, 'D1', 200, 'Active', 0), (4, 'D2', 200, 'Active', 0), (4, 'D3', 200, 'Active', 0),
    (4, 'D4', 200, 'Active', 0), (4, 'D5', 200, 'Faulty', 0), (4, 'D6', 200, 'Active', 0),
    (5, 'E1', 200, 'Active', 0), (5, 'E2', 200, 'Active', 0), (5, 'E3', 200, 'Active', 0),
    (5, 'E4', 200, 'Active', 0), (5, 'E5', 200, 'Active', 0), (5, 'E6', 200, 'Faulty', 0),
    (6, 'F1', 200, 'Active', 0), (6, 'F2', 200, 'Active', 0), (6, 'F3', 200, 'Active', 0),
    (6, 'F4', 200, 'Active', 0), (6, 'F5', 200, 'Faulty', 0);

INSERT INTO Coach (train_id, coach_number, capacity, status, is_reserved) VALUES
    (NULL, 'RES-1', 200, 'Reserved', 1), (NULL, 'RES-2', 200, 'Reserved', 1), (NULL, 'RES-3', 200, 'Reserved', 1),
    (NULL, 'RES-4', 200, 'Reserved', 1), (NULL, 'RES-5', 200, 'Reserved', 1), (NULL, 'RES-6', 200, 'Reserved', 1);


-- Demo completed journey: Uttara North -> Agargaon (fare = 60tk per matrix)
INSERT INTO Passenger_movement (passenger_id, entry_station_id, exit_station_id, entry_time, exit_time, fare)
VALUES (2, 1, 9, DATEADD(hour,-3, GETDATE()), DATEADD(hour,-2, GETDATE()), 60.0);

-- Demo active journey: currently at Farmgate
INSERT INTO Passenger_movement (passenger_id, entry_station_id, entry_time)
VALUES (2, 11, DATEADD(hour,-1, GETDATE()));

-- Demo active journey for another passenger at Mirpur 10
INSERT INTO Passenger_movement (passenger_id, entry_station_id, entry_time)
VALUES (3, 6, DATEADD(minute,-45, GETDATE()));

GO

