USE master;
GO
ALTER DATABASE metro_db 
SET SINGLE_USER 
WITH ROLLBACK IMMEDIATE;
GO
DROP DATABASE metro_db;
GO


create database metro_db
GO

use metro_db
GO

create table Route (
route_id int identity(1,1) primary key,
distance float,
duration int
)

create table Station (
station_id int identity(1,1) primary key,
station_name varchar(100),
location varchar(200)
)

create table Train (
train_id int identity(1,1) primary key,
train_name varchar(100),
capacity int,
route_id int,
foreign key (route_id) references Route(route_id)
)

create table Schedule (
schedule_id int identity(1,1) primary key,
departure_time time,
arrival_time time,
route_id int,
foreign key (route_id) references Route(route_id)
)

create table Employee (
employee_id int identity(1,1) primary key,
name varchar(100),
nid varchar(30),
role varchar(50),
shift varchar(50),
station_id int,
foreign key (station_id) references Station(station_id)
)

create table Passenger (
passenger_id int identity(1,1) primary key,
name varchar(100),
password varchar(MAX),
nid varchar(30) UNIQUE
)

create table Ticket (
ticket_id int identity(1,1) primary key,
passenger_id int,
date date,
paid_status varchar(20),
foreign key (passenger_id) references Passenger(passenger_id)
)

create table Fine (
fine_id int identity(1,1) primary key,
passenger_id int,
reason varchar(200),
date date,
amount float,
foreign key (passenger_id) references Passenger(passenger_id)
)

create table Passenger_movement (
passenger_movement_id int identity(1,1) primary key,
passenger_id int,
station_id int,
entry_time datetime,
exit_time datetime,
fare float,
foreign key (passenger_id) references Passenger(passenger_id),
foreign key (station_id) references Station(station_id)
)

create table Train_status (
train_status_id int identity(1,1) primary key,
train_id int,
update_time datetime,
status varchar(50),
date date,
foreign key (train_id) references Train(train_id)
)

create table Route_station (
route_id int,
station_id int,
primary key (route_id, station_id),
foreign key (route_id) references Route(route_id),
foreign key (station_id) references Station(station_id)
)