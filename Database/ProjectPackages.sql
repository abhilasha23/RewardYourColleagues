CREATE OR REPLACE PACKAGE app_user_security AS

   FUNCTION get_hash (p_username  IN  VARCHAR2,
                     p_password  IN  VARCHAR2)
    RETURN VARCHAR2;
    
   PROCEDURE valid_user (p_username  IN  VARCHAR2,
                         p_password  IN  VARCHAR2);

    FUNCTION valid_user (p_username  IN  VARCHAR2,
                         p_password  IN  VARCHAR2)
    RETURN BOOLEAN;
END;
/

CREATE OR REPLACE
PACKAGE BODY APP_USER_SECURITY AS

  FUNCTION get_hash (p_username  IN  VARCHAR2,
                     p_password  IN  VARCHAR2)
    RETURN VARCHAR2 AS
    l_salt VARCHAR2(30) := 'MSITMIsAwesome';
  BEGIN
    -- Pre Oracle 10g
    RETURN DBMS_OBFUSCATION_TOOLKIT.MD5(
      input_string => UPPER(p_username) || l_salt || UPPER(p_password));

    -- Oracle 10g+ : Requires EXECUTE on DBMS_CRYPTO
    --RETURN DBMS_CRYPTO.HASH(UTL_RAW.CAST_TO_RAW(UPPER(p_username) || l_salt || UPPER(p_password)),DBMS_CRYPTO.HASH_SH1);
  END;

  PROCEDURE valid_user (p_username  IN  VARCHAR2,
                        p_password  IN  VARCHAR2) AS
    v_dummy  VARCHAR2(1);
  BEGIN
    SELECT '1'
    INTO   v_dummy
    FROM   EMP_LOGIN_DETAILS
    WHERE  EMPUSERNAME = UPPER(p_username)
    AND    PASSWRD = get_hash(p_username, p_password);
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20000, 'Invalid username/password.');
  END;
  
  FUNCTION valid_user (p_username  IN  VARCHAR2,
                       p_password  IN  VARCHAR2) 
    RETURN BOOLEAN AS
  BEGIN
    valid_user(p_username, p_password);
    RETURN TRUE;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN FALSE;
  END;

END APP_USER_SECURITY;


CREATE OR REPLACE 
PACKAGE APP_USER_GENERAL AS 

  
  FUNCTION get_userdata (p_username  IN  VARCHAR2)
    RETURN VARCHAR2;

  PROCEDURE add_points_transaction (from_username  IN  VARCHAR2,
                                    to_username  IN  VARCHAR2,
                                    points IN NUMBER,
                                    res OUT VARCHAR2);
 PROCEDURE redeem_points (by_user IN VARCHAR2,
                           points IN NUMBER,
                           res OUT VARCHAR2);

END APP_USER_GENERAL;

CREATE OR REPLACE
PACKAGE BODY APP_USER_GENERAL AS

  FUNCTION get_userdata (p_username  IN  VARCHAR2)
    RETURN VARCHAR2 IS dummy varchar2(100) ;
  BEGIN
   SELECT EMP_ID || ',' || EMPUSERNAME || ','||emp_fname||','||emp_lname||','||emp_type
   into dummy
   FROM EMPLOYEE_DETAILS 
   WHERE empusername=p_username;
   
    RETURN dummy;
  END get_userdata;


PROCEDURE add_points_transaction (from_username  IN  VARCHAR2,
                                    to_username  IN  VARCHAR2,
                                    points IN NUMBER,
                                    res OUT VARCHAR2) AS
  BEGIN
    INSERT INTO POINTS_TRANSACTION (
      id,
      TRANSACTION_TIMESTAMP,
      BY_EMP,
      TO_EMP,
      POINTS
      
    )
    VALUES (
      transaction_seq.NEXTVAL,
      CURRENT_TIMESTAMP,
      UPPER(from_username),
      UPPER(to_username),
      points
    );
    
    UPDATE EMP_GIVE_POINTS_TALLY
    SET POINTS_TO_GIVE = POINTS_TO_GIVE - points
    WHERE EMP_USERNAME = from_username;
    
    UPDATE EMP_RECEIVE_POINTS_TALLY
    SET POINTS_TO_REDEEM = POINTS_TO_REDEEM + points
    WHERE EMP_USERNAME = to_username ;
    
    COMMIT;
    res := 'Success';
    
    EXCEPTION
    WHEN OTHERS THEN
      res := 'Fail';
    
  END;
  
  PROCEDURE redeem_points (by_user IN VARCHAR2,
                           points IN NUMBER,
                           res OUT VARCHAR2) AS
  BEGIN
  
  INSERT INTO EMPLOYEE_POINTS_REDEEM_HISTORY (
  id,
  EMP_USERNAME,
  POINTS_REDEEMED,
  REDEEM_TIMESTAMP,
  MONTH,
  YEAR,
  REDEEM_FLAG
  )
  VALUES (
  redeem_seq.NEXTVAL,
  UPPER(by_user),
  points,
  CURRENT_TIMESTAMP,
  to_char(CURRENT_TIMESTAMP , 'MONTH'),
  to_char(CURRENT_TIMESTAMP , 'YYYY'),
  'True'
  );
  
  UPDATE EMP_RECEIVE_POINTS_TALLY
    SET POINTS_TO_REDEEM = POINTS_TO_REDEEM - points
    WHERE EMP_USERNAME = by_user ;
    
  COMMIT;
  res := 'Success';
    
    EXCEPTION
    WHEN OTHERS THEN
      res := 'Fail';
  
  END;


END APP_USER_GENERAL;

