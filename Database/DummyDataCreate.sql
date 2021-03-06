select * from EMP_GIVE_POINTS_TALLY;

INSERT INTO EMP_GIVE_POINTS_TALLY(ID,EMP_USERNAME,MONTH,YEAR,POINTS_TO_GIVE)
  SELECT givepoints_seq.nextval,EMP_USERNAME, 'AUGUST','2018',POINTS_TO_GIVE
  FROM 
  EMP_GIVE_POINTS_TALLY
  WHERE trim(MONTH)='OCTOBER';
  
  commit;
  

INSERT INTO POINTS_TRANSACTION (ID,TRANSACtion_TIMESTAMP,BY_EMP,TO_EMP,POINTS)
SELECT transaction_seq.nextval,transaction_timestamp - interval '2' month,BY_EMP,TO_EMP,POINTS from POINTS_TRANSACTION WHERE trim(to_char(TRANSACtion_TIMESTAMP,'MONTH')) = 'OCTOBER';

commit;
 
SELECT transaction_seq.nextval,transaction_timestamp - interval '2' month,BY_EMP,TO_EMP,POINTS 
from POINTS_TRANSACTION
WHERE trim(to_char(TRANSACtion_TIMESTAMP,'MONTH')) = 'OCTOBER';
  
UPDATE EMP_RECEIVE_POINTS_TALLY
SET POINTS_TO_REDEEM = POINTS_TO_REDEEM*3 ;
commit;

select * from EMP_RECEIVE_POINTS_TALLY;



   