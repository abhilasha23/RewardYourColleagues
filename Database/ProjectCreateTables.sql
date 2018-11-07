-- All tables for final Project follows


-- Table EmployeeDetails
CREATE TABLE EMPLOYEE_DETAILS (
   EMP_ID VARCHAR2(20) PRIMARY KEY
  ,EMPUSERNAME VARCHAR2(20) NOT NULL UNIQUE
  ,EMP_FNAME VARCHAR2(100)
  ,EMP_LNAME VARCHAR2(100)
  ,EMP_TYPE VARCHAR2(20) DEFAULT 'Regular'
);


-- Table EmpLoginDetails
CREATE TABLE EMP_LOGIN_DETAILS (
    EMPUSERNAME VARCHAR2(20) PRIMARY KEY
   ,PASSWRD VARCHAR2(100) NOT NULL
   ,LAST_LOGIN TIMESTAMP
   ,CONSTRAINT fk_usrname FOREIGN KEY (EMPUSERNAME) REFERENCES EMPLOYEE_DETAILS (EMPUSERNAME)
);


-- create a transaction sequence to be used in PointsTransaction Table
CREATE SEQUENCE transaction_seq START WITH 1;

-- Table PointsTransaction
CREATE TABLE POINTS_TRANSACTION (
   ID NUMBER(10) DEFAULT transaction_seq.nextval PRIMARY KEY
  ,TRANSACTION_TIMESTAMP TIMESTAMP
  ,BY_EMP VARCHAR2(20)
  ,TO_EMP VARCHAR2(20)
  ,POINTS NUMBER(20)
  ,CONSTRAINT fk_byusrid FOREIGN KEY (BY_EMP) REFERENCES EMPLOYEE_DETAILS (EMPUSERNAME)
  ,CONSTRAINT fk_tousrid FOREIGN KEY (TO_EMP) REFERENCES EMPLOYEE_DETAILS (EMPUSERNAME)
);

-- create a sequence to be used in Emp_Give_Points_Tally Table
CREATE SEQUENCE givepoints_seq START WITH 1;

CREATE TABLE EMP_GIVE_POINTS_TALLY (
    ID NUMBER(10) DEFAULT givepoints_seq.nextval PRIMARY KEY
   ,EMP_USERNAME VARCHAR2(20)
   ,MONTH VARCHAR2(50)
   ,YEAR VARCHAR2(10)
   ,POINTS_TO_GIVE NUMBER(20)
   ,CONSTRAINT fk_usrid FOREIGN KEY (EMP_USERNAME) REFERENCES EMPLOYEE_DETAILS (EMPUSERNAME)
   ,CONSTRAINT mon_var CHECK (MONTH IN ('JANUARY', 'FEBRUARY','MARCH','APRIL','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'))
);


-- create a sequence to be used in Emp_RECEIVE_Points_Tally Table
CREATE SEQUENCE receivepoints_seq START WITH 1;


CREATE TABLE EMP_RECEIVE_POINTS_TALLY (
    ID NUMBER(10) DEFAULT givepoints_seq.nextval PRIMARY KEY
   ,EMP_USERNAME VARCHAR2(20)
   --,MONTH VARCHAR2(50)
   ,YEAR VARCHAR2(10)
   ,POINTS_TO_REDEEM NUMBER(20)
   ,CONSTRAINT fk_usrid2 FOREIGN KEY (EMP_USERNAME) REFERENCES EMPLOYEE_DETAILS (EMPUSERNAME)
  ,CONSTRAINT mon_var2 CHECK (MONTH IN ('JANUARY', 'FEBRUARY','MARCH','APRIL','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'))
);

-- create a sequence to be used in EMPLOYEE_POINTS_REDEEM_HISTORY Table
CREATE SEQUENCE redeem_seq START WITH 1;

-- Table EmployeePointsRedeemHistory
CREATE TABLE EMPLOYEE_POINTS_REDEEM_HISTORY(
   ID NUMBER(10) DEFAULT redeem_seq.nextval PRIMARY KEY
  ,EMP_USERNAME VARCHAR(20)
  ,POINTS_REDEEMED NUMBER(20)
  ,REDEEM_TIMESTAMP TIMESTAMP
  ,MONTH VARCHAR2(50)
  ,YEAR VARCHAR2(10)
  ,REDEEM_FLAG VARCHAR2(10)
  ,CONSTRAINT fk_usrid3 FOREIGN KEY (EMP_USERNAME) REFERENCES EMPLOYEE_DETAILS (EMPUSERNAME)
  --,CONSTRAINT mon_var3 CHECK (MONTH IN ('JANUARY', 'FEBRUARY','MARCH','APRIL','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'))
  ,CONSTRAINT redeemflag_var CHECK (REDEEM_FLAG IN ('True','False'))
);


CREATE VIEW AGGREGATE_USAGE_REPORT (month,emp_username,given_points,received_points)
AS 
SELECT X.month month, X.by_emp emp_username, X.given_points, Y.received_points
 from 
 (
 select to_char(transaction_timestamp,'MONTH') month,to_char(transaction_timestamp,'MM') monthnum,by_emp,sum(points) given_points
 from POINTS_TRANSACTION
 group by to_char(transaction_timestamp,'MONTH'),to_char(transaction_timestamp,'MM') ,by_emp
 ) X
 FULL OUTER JOIN
 (
 select to_char(transaction_timestamp,'MONTH') month,to_char(transaction_timestamp,'MM') monthnum,to_emp,sum(points) received_points
 from POINTS_TRANSACTION
 group by to_char(transaction_timestamp,'MONTH'),to_char(transaction_timestamp,'MM') ,to_emp
 ) Y ON X.by_emp = Y.to_emp AND X.month = Y.month
 
 ORDER BY X.monthnum desc,Y.received_points desc;

commit;

