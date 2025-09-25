@echo off
setlocal enabledelayedexpansion

REM Todo App Docker Setup Script for Windows (FIXED VERSION)
REM This script detects if Docker is installed, installs it if needed, and sets up the entire project

REM Colors for output (Windows doesn't support colors in batch, but we'll use echo for clarity)
set "INFO_PREFIX=[INFO]"
set "SUCCESS_PREFIX=[SUCCESS]"
set "WARNING_PREFIX=[WARNING]"
set "ERROR_PREFIX=[ERROR]"

REM Function to print status messages
:print_status
echo %INFO_PREFIX% %~1
goto :eof

:print_success
echo %SUCCESS_PREFIX% %~1
goto :eof

:print_warning
echo %WARNING_PREFIX% %~1
goto :eof

:print_error
echo %ERROR_PREFIX% %~1
goto :eof

:print_header
echo ================================
echo %~1
echo ================================
goto :eof

REM Function to check if command exists
:command_exists
where %1 >nul 2>&1
if %errorlevel% equ 0 (
    exit /b 0
) else (
    exit /b 1
)

REM Function to detect Windows version
:detect_windows
call :print_status "Detected OS: Windows"
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
call :print_status "Windows Version: %VERSION%"
goto :eof

REM Function to check and install Docker
:check_and_install_docker
call :print_header "Checking Docker Installation"

where docker >nul 2>&1
if %errorlevel% equ 0 (
    call :print_success "Docker is already installed!"
    docker --version
    
    REM Check if Docker daemon is running
    docker info >nul 2>&1
    if %errorlevel% equ 0 (
        call :print_success "Docker daemon is running!"
    ) else (
        call :print_warning "Docker is installed but daemon is not running."
        call :print_status "Please start Docker Desktop and try again."
        call :print_status "You can start Docker Desktop from the Start menu or system tray."
        pause
        exit /b 1
    )
) else (
    call :print_warning "Docker is not installed."
    call :print_error "Please install Docker Desktop manually from:"
    call :print_error "https://www.docker.com/products/docker-desktop/"
    call :print_error "After installation, restart your computer and run this script again."
    pause
    exit /b 1
)
goto :eof

REM Function to check Docker Compose
:check_docker_compose
call :print_header "Checking Docker Compose"

docker compose version >nul 2>&1
if %errorlevel% equ 0 (
    call :print_success "Docker Compose is available!"
    docker compose version
) else (
    call :print_error "Docker Compose is not available!"
    call :print_error "Please ensure you have Docker Compose installed."
    pause
    exit /b 1
)
goto :eof

REM Function to validate email address (FIXED - Windows compatible regex)
:validate_email
set "email=%~1"
REM Use simpler Windows-compatible regex
echo %email% | findstr /r "^[a-zA-Z0-9._%%+-]*@[a-zA-Z0-9.-]*\.[a-zA-Z]*$" >nul
if %errorlevel% equ 0 (
    exit /b 0
) else (
    exit /b 1
)

REM Function to validate port number (FIXED - Windows compatible regex)
:validate_port
set "port=%~1"
REM Use simpler Windows-compatible regex
echo %port% | findstr /r "^[0-9]*$" >nul
if %errorlevel% equ 0 (
    if %port% geq 1 if %port% leq 65535 (
        exit /b 0
    )
)
exit /b 1

REM Function to get user input with default value
:get_input
set "prompt=%~1"
set "default=%~2"
set "var_name=%~3"

if not "%default%"=="" (
    set /p "input=%prompt% [%default%]: "
    if "!input!"=="" set "input=%default%"
) else (
    set /p "input=%prompt%: "
)
set "%var_name%=!input!"
goto :eof

REM Function to get SMTP configuration interactively
:get_smtp_config
call :print_header "SMTP Configuration"
echo Configure your SMTP settings for email reminders
echo.

REM SMTP Host
call :get_input "SMTP Host (e.g., smtp.gmail.com)" "smtp.gmail.com" "SMTP_HOST"

REM SMTP Port
:get_smtp_port
call :get_input "SMTP Port" "587" "SMTP_PORT"
call :validate_port "%SMTP_PORT%"
if %errorlevel% neq 0 (
    call :print_error "Invalid port number. Please enter a number between 1 and 65535."
    goto :get_smtp_port
)

REM SMTP User (Email)
:get_smtp_user
call :get_input "SMTP Username (your email address)" "" "SMTP_USER"
call :validate_email "%SMTP_USER%"
if %errorlevel% neq 0 (
    call :print_error "Invalid email address. Please enter a valid email."
    goto :get_smtp_user
)

REM SMTP Password
echo.
echo %WARNING_PREFIX% Note: For Gmail, use an App Password, not your regular password
echo %WARNING_PREFIX% To create an App Password:
echo %WARNING_PREFIX% 1. Enable 2-Factor Authentication on your Google account
echo %WARNING_PREFIX% 2. Go to Google Account → Security → 2-Step Verification → App passwords
echo %WARNING_PREFIX% 3. Generate a new app password for 'Mail'
echo.
set /p "SMTP_PASS=SMTP Password (App Password for Gmail): "

REM From Name
call :get_input "From Name (sender display name)" "Todo Reminder" "FROM_NAME"

REM From Email
:get_from_email
call :get_input "From Email (sender email address)" "%SMTP_USER%" "FROM_EMAIL"
call :validate_email "%FROM_EMAIL%"
if %errorlevel% neq 0 (
    call :print_error "Invalid email address. Please enter a valid email."
    goto :get_from_email
)

REM Rate Limiting (optional)
echo.
call :print_status "Rate Limiting Configuration (optional)"
call :get_input "Rate Limit Window (milliseconds)" "900000" "RATE_LIMIT_WINDOW_MS"
call :get_input "Max Requests per Window" "100" "RATE_LIMIT_MAX_REQUESTS"
goto :eof

REM Function to display configuration summary
:show_config_summary
call :print_header "Configuration Summary"
echo SMTP Host: %SMTP_HOST%
echo SMTP Port: %SMTP_PORT%
echo SMTP User: %SMTP_USER%
echo SMTP Password: %SMTP_PASS:~0,4%****
echo From Name: %FROM_NAME%
echo From Email: %FROM_EMAIL%
echo Rate Limit Window: %RATE_LIMIT_WINDOW_MS% ms
echo Max Requests: %RATE_LIMIT_MAX_REQUESTS%
echo.
goto :eof

REM Function to create environment file
:setup_environment
call :print_header "Setting up Environment Configuration"

if exist .env (
    call :print_warning "Environment file (.env) already exists!"
    echo.
    echo Current configuration:
    echo ======================
    REM FIXED: Use Windows-compatible command instead of head
    if exist .env (
        for /f "tokens=1 delims==" %%a in ('findstr /r "^[A-Z_]" .env') do (
            echo %%a
        )
    )
    echo.
    
    :env_choice
    set /p "choice=Do you want to (u)se existing config, (r)ecreate it, or (e)dit manually? [u/r/e]: "
    if /i "%choice%"=="u" (
        call :print_success "Using existing environment configuration!"
        goto :eof
    ) else if /i "%choice%"=="r" (
        call :print_status "Recreating environment configuration..."
    ) else if /i "%choice%"=="e" (
        call :print_status "Opening .env file for manual editing..."
        notepad .env
        call :print_success "Environment configuration updated!"
        goto :eof
    ) else (
        call :print_error "Please enter 'u' for use existing, 'r' for recreate, or 'e' for edit manually."
        goto :env_choice
    )
)

REM Get SMTP configuration interactively
call :get_smtp_config

REM Show configuration summary
call :show_config_summary

REM Confirm configuration
:confirm_config
set /p "confirm=Is this configuration correct? [y/n]: "
if /i "%confirm%"=="y" (
    goto :create_env_files
) else if /i "%confirm%"=="n" (
    call :print_status "Let's reconfigure..."
    call :get_smtp_config
    call :show_config_summary
    goto :confirm_config
) else (
    call :print_error "Please enter 'y' for yes or 'n' for no."
    goto :confirm_config
)

:create_env_files
REM Create .env file
call :print_status "Creating .env file..."
(
echo # Todo App Environment Configuration
echo # Generated by docker-setup.bat on %date% %time%
echo.
echo # SMTP Configuration for Email Reminders
echo SMTP_HOST=%SMTP_HOST%
echo SMTP_PORT=%SMTP_PORT%
echo SMTP_USER=%SMTP_USER%
echo SMTP_PASS=%SMTP_PASS%
echo.
echo # Email Settings
echo FROM_NAME=%FROM_NAME%
echo FROM_EMAIL=%FROM_EMAIL%
echo.
echo # Rate Limiting (optional)
echo RATE_LIMIT_WINDOW_MS=%RATE_LIMIT_WINDOW_MS%
echo RATE_LIMIT_MAX_REQUESTS=%RATE_LIMIT_MAX_REQUESTS%
echo.
echo # Application Settings
echo NODE_ENV=production
) > .env

REM Also create backend .env file
call :print_status "Creating backend .env file..."
(
echo # Backend Environment Configuration
echo # Generated by docker-setup.bat on %date% %time%
echo.
echo # SMTP Configuration for Email Reminders
echo SMTP_HOST=%SMTP_HOST%
echo SMTP_PORT=%SMTP_PORT%
echo SMTP_USER=%SMTP_USER%
echo SMTP_PASS=%SMTP_PASS%
echo.
echo # Email Settings
echo FROM_NAME=%FROM_NAME%
echo FROM_EMAIL=%FROM_EMAIL%
echo.
echo # Rate Limiting (optional)
echo RATE_LIMIT_WINDOW_MS=%RATE_LIMIT_WINDOW_MS%
echo RATE_LIMIT_MAX_REQUESTS=%RATE_LIMIT_MAX_REQUESTS%
echo.
echo # Application Settings
echo NODE_ENV=production
echo PORT=3001
) > backend\.env

call :print_success "Environment files created successfully!"
call :print_status "Frontend .env: %cd%\.env"
call :print_status "Backend .env: %cd%\backend\.env"
goto :eof

REM Function to check if curl is available
:check_curl
where curl >nul 2>&1
if %errorlevel% equ 0 (
    exit /b 0
) else (
    exit /b 1
)

REM Function to test HTTP endpoint (FIXED - Windows compatible)
:test_http_endpoint
set "url=%~1"
set "description=%~2"

call :check_curl
if %errorlevel% equ 0 (
    REM Use curl if available
    curl -s "%url%" >nul 2>&1
    if %errorlevel% equ 0 (
        call :print_success "%description% is responding!"
        exit /b 0
    ) else (
        call :print_warning "%description% might still be starting up"
        exit /b 1
    )
) else (
    REM Use PowerShell as fallback
    powershell -Command "try { Invoke-WebRequest -Uri '%url%' -UseBasicParsing -TimeoutSec 5 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
    if %errorlevel% equ 0 (
        call :print_success "%description% is responding!"
        exit /b 0
    ) else (
        call :print_warning "%description% might still be starting up"
        exit /b 1
    )
)

REM Function to build and start containers
:build_and_start
call :print_header "Building and Starting Todo App"

call :print_status "Building Docker images..."
docker compose build --no-cache
if %errorlevel% neq 0 (
    call :print_error "Failed to build Docker images!"
    pause
    exit /b 1
)

call :print_status "Starting containers..."
docker compose up -d
if %errorlevel% neq 0 (
    call :print_error "Failed to start containers!"
    pause
    exit /b 1
)

call :print_success "Todo App is starting up!"

REM Wait for services to be ready
call :print_status "Waiting for services to be ready..."
timeout /t 10 /nobreak >nul

REM Check if services are running
docker compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    call :print_success "Services are running!"
    
    REM Display service status
    call :print_header "Service Status"
    docker compose ps
    
    REM Display URLs
    call :print_header "Application URLs"
    echo Frontend: http://localhost:3000
    echo Backend API: http://localhost:3001
    echo Health Check: http://localhost:3001/api/health
    
    call :print_header "Next Steps"
    echo 1. Open http://localhost:3000 in your browser
    echo 2. Go to Settings page to configure email reminders
    echo 3. Test the email functionality
    echo.
    echo To stop the application: docker compose down
    echo To view logs: docker compose logs -f
    echo To restart: docker compose restart
    
) else (
    call :print_error "Failed to start services!"
    call :print_status "Checking logs..."
    docker compose logs
    pause
    exit /b 1
)
goto :eof

REM Function to test the application (FIXED - Windows compatible)
:test_application
call :print_header "Testing Application"

call :print_status "Testing backend health endpoint..."
call :test_http_endpoint "http://localhost:3001/api/health" "Backend"

call :print_status "Testing frontend..."
call :test_http_endpoint "http://localhost:3000" "Frontend"
goto :eof

REM Function to show help
:show_help
echo Todo App Docker Setup Script for Windows
echo.
echo Usage: %~nx0 [OPTIONS]
echo.
echo Options:
echo   --help, -h          Show this help message
echo   --skip-docker       Skip Docker installation check
echo   --skip-build        Skip building Docker images
echo   --test-only         Only test existing setup
echo   --clean             Clean up existing containers and images
echo.
echo Examples:
echo   %~nx0                  # Full setup with Docker installation
echo   %~nx0 --skip-docker    # Setup without checking Docker
echo   %~nx0 --test-only      # Test existing setup
echo   %~nx0 --clean          # Clean up and rebuild
goto :eof

REM Function to clean up
:cleanup
call :print_header "Cleaning up existing setup"

call :print_status "Stopping containers..."
docker compose down -v

call :print_status "Removing images..."
docker compose down --rmi all

call :print_status "Cleaning up volumes..."
docker volume prune -f

call :print_success "Cleanup completed!"
goto :eof

REM Main function
:main
call :print_header "Todo App Docker Setup"
echo This script will set up the Todo App with Docker
echo.

REM Parse command line arguments
set "SKIP_DOCKER=false"
set "SKIP_BUILD=false"
set "TEST_ONLY=false"
set "CLEAN=false"

:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--help" goto :show_help
if /i "%~1"=="-h" goto :show_help
if /i "%~1"=="--skip-docker" set "SKIP_DOCKER=true"
if /i "%~1"=="--skip-build" set "SKIP_BUILD=true"
if /i "%~1"=="--test-only" set "TEST_ONLY=true"
if /i "%~1"=="--clean" set "CLEAN=true"
shift
goto :parse_args

:args_done
REM Detect Windows
call :detect_windows

REM Clean up if requested
if "%CLEAN%"=="true" (
    call :cleanup
    if "%TEST_ONLY%"=="true" (
        exit /b 0
    )
)

REM Test only mode
if "%TEST_ONLY%"=="true" (
    call :test_application
    exit /b 0
)

REM Check and install Docker
if "%SKIP_DOCKER%"=="false" (
    call :check_and_install_docker
    call :check_docker_compose
) else (
    call :print_warning "Skipping Docker installation check"
)

REM Setup environment
call :setup_environment

REM Build and start if not skipping build
if "%SKIP_BUILD%"=="false" (
    call :build_and_start
) else (
    call :print_status "Starting existing containers..."
    docker compose up -d
)

REM Test the application
call :test_application

call :print_header "Setup Complete!"
call :print_success "Todo App is now running in Docker containers!"
call :print_status "Visit http://localhost:3000 to start using the app"

pause
goto :eof

REM Run main function with all arguments
call :main %*