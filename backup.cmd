@echo off
REM Free local backup: Postgres dump + uploads copy. Run from project root.
set STAMP=%date:~-4%-%date:~4,2%-%date:~7,2%
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost plannlyai > backup-%STAMP%.sql
if %errorlevel% neq 0 echo PGPASSWORD not set. Run: set PGPASSWORD=yourpassword ^& backup.cmd
xcopy storage backup-storage-%STAMP%\ /E /I /Y
echo Backup done: backup-%STAMP%.sql + backup-storage-%STAMP%\
