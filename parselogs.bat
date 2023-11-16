@echo off
if "%1"=="" (
    echo Usage: %0 ^<file_path^>
    exit /b 1
)

set "inputFile=%1"
set "outputFile=%inputFile:.=%_modified.json"

echo [ > "%outputFile%"
set "isFirstLine=true"

for /f "tokens=*" %%a in ('type "%inputFile%"') do (
    echo|set /p=%%a>> "%outputFile%"
    echo ,>> "%outputFile%"
    set "isFirstLine=false"
)

echo ]>> "%outputFile%"
echo File modification complete. Output saved to "%outputFile%"
