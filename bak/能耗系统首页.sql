SELECT district,grid,count(1) FROM energy_charge_daily_summary GROUP BY district,grid

SELECT count(1) FROM energy_charge_daily_summary WHERE stat_date = '2026-03-12' limit 10;

SELECT stat_date,count(1) FROM energy_charge_daily_summary  GROUP BY stat_date ORDER BY stat_date desc;

SELECT meter,count(1)  FROM energy_charge_daily_summary WHERE stat_date = '2026-03-12'  GROUP BY meter HAVING count(1) >1;


SELECT * FROM energy_charge_daily_summary WHERE stat_date = '2026-02-20' and grid = '三井网格'; 
SELECT sum（ FROM energy_charge_daily_summary WHERE stat_date LIKE '2026-03%' and grid = '三井网格'; 

SELECT count(1),COUNT(DISTINCT grid) FROM energy_charge_daily_summary  WHERE stat_date = '2026-03-20';

SHOW COLUMNS FROM energy_charge_daily_summary;

SHOW COLUMNS FROM energy_charge;

SELECT * FROM energy_charge_daily_summary WHERE grid = '三井网格' ORDER BY stat_date DESC; 

SELECT max(日期) from energy_charge;-- limit 10;
SELECT * FROM energy_charge limit 10;

SELECT * FROM energy_charge where 归属网格 = '三井网格' and 日期 = '2026-03-20';

SELECT * FROM energy_charge WHERE 用电属性 is not NULL limit
SELECT 用电方,count(1) FROM energy_charge GROUP BY 用电方



SELECT sum(overview_total_energy), sum(overview_total_cost) FROM energy_charge_daily_summary WHERE stat_date LIKE '2026-03%' and grid = '三井网格'; 
SELECT sum(overview_total_energy), sum(overview_total_cost) FROM energy_charge_daily_summary WHERE stat_date LIKE '2026-02%' and grid = '三井网格'; 

SELECT sum(overview_total_energy), sum(overview_total_cost) FROM energy_charge_daily_summary WHERE stat_date LIKE '2026%' and grid = '三井网格'; 
SELECT sum(overview_total_energy), sum(overview_total_cost) FROM energy_charge_daily_summary WHERE stat_date LIKE '2026-02%' and grid = '三井网格'; 



SHOW COLUMNS FROM energy_charge_daily_summary;