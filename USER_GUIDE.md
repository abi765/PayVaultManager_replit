# PayVault User Guide

> **⚠️ IMPORTANT NOTICE - TEST DEPLOYMENT**
>
> This application is currently in **TEST MODE** and deployed for testing purposes only.
> - The current deployment uses test data and configurations
> - This is NOT ready for production use
> - Do NOT enter real employee data or process actual salary payments yet
> - Thorough testing is required before production deployment
> - Contact your system administrator before using this for actual business operations

## Table of Contents
1. [Getting Started](#getting-started)
2. [Login](#login)
3. [Dashboard Overview](#dashboard-overview)
4. [Managing Employees](#managing-employees)
5. [Salary Management](#salary-management)
6. [Overtime Management](#overtime-management)
7. [Deductions & Allowances](#deductions--allowances)
8. [User Management](#user-management)
9. [Settings](#settings)
10. [Common Workflows](#common-workflows)

---

## Getting Started

PayVault is an employee salary management system designed for Pakistani businesses. It helps you manage employee records, calculate salaries with allowances and deductions, track overtime, and process salary payments.

### Accessing the Application

**Test Deployment:**
- **Live App:** [https://payvault-app.onrender.com](https://payvault-app.onrender.com)
- **Status:** Testing Phase - Not for Production Use

**Local Development:**
- **URL:** `http://localhost:5000`
- **Use for:** Development and testing

**Steps to Access:**
1. Open your web browser
2. Click on the link above or navigate to the URL
3. You will be redirected to the login page
4. Enter your credentials (see Login section below)

---

## Login

### Test User Accounts

The system comes with three pre-configured user accounts for testing all role permissions:

**Administrator Account:**

- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Admin (Full access to all features)

**Manager Account:**

- **Username:** `manager`
- **Password:** `manager123`
- **Role:** Manager (Can manage employees and salaries, but not users)

**Viewer Account:**

- **Username:** `viewer`
- **Password:** `viewer123`
- **Role:** Viewer (Read-only access to all data)

**Important:** Change default passwords immediately for production use. These credentials are for testing purposes only.

### User Roles

PayVault has three user roles with different permissions:

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features including user management, employee management, salary processing, and system settings |
| **Manager** | Can manage employees, process salaries, manage overtime, deductions, and allowances. Cannot manage users |
| **Viewer** | Read-only access to view employees, salaries, and reports. Cannot make any changes |

### Switching Users

To switch to a different user account:

1. Click on your username in the sidebar (bottom section)
2. Click **Logout** button
3. You will be redirected to the login page
4. Login with different user credentials

**Note:** You can test different user roles by logging out and logging in with different accounts (admin, manager, or viewer).

---

## Dashboard Overview

After logging in, you'll see the Dashboard - your central hub for monitoring key metrics.

### Dashboard Metrics

The dashboard displays:

1. **Total Employees** - Total number of employees in the system
2. **Active Employees** - Employees currently on payroll
3. **Inactive Employees** - Employees who are no longer active
4. **Monthly Payroll** - Total salary amount for the current month
5. **Pending Payments** - Number of salary payments awaiting processing
6. **Processed Payments** - Number of completed salary payments

### Navigation Sidebar

The left sidebar contains navigation to all main sections:
- **Dashboard** - Overview and statistics
- **Employees** - Manage employee records
- **Salary** - Process and manage salary payments
- **Overtime** - Track and manage overtime hours
- **Deductions** - Manage salary deductions
- **Allowances** - Manage salary allowances
- **Users** - Manage system users (Admin only)
- **Settings** - Account settings and password change

---

## Managing Employees

### Viewing Employees

1. Click **Employees** in the sidebar
2. You'll see a list of all employees with:
   - Employee ID
   - Full Name
   - Department
   - Position
   - Base Salary
   - Status (Active/Inactive)
   - Join Date

### Adding a New Employee

1. Click **Employees** in the sidebar
2. Click the **Add Employee** button
3. Fill in the employee information:
   - **Employee ID** - Unique identifier (e.g., EMP001)
   - **Full Name** - Employee's complete name
   - **Email** - Contact email address
   - **Phone** - Contact phone number
   - **CNIC** - Computerized National Identity Card number
   - **Department** - e.g., IT, HR, Finance, Operations
   - **Position** - Job title
   - **Base Salary** - Monthly salary in PKR
   - **Bank Account Number** - For salary transfers
   - **Bank Name** - Employee's bank name
   - **Join Date** - Date of joining
   - **Address** - Residential address
   - **Status** - Active or Inactive
4. Click **Save** to create the employee record

### Editing Employee Information

1. In the Employees list, click on an employee row
2. Click the **Edit** button
3. Modify the required information
4. Click **Save** to update

### Deactivating an Employee

1. Click on the employee record
2. Click **Edit**
3. Change **Status** to "Inactive"
4. Click **Save**

**Note:** Inactive employees will not be included in salary generation.

---

## Salary Management

### Generating Monthly Salaries

**Important:** Salaries are generated on a monthly basis for all active employees.

1. Click **Salary** in the sidebar
2. Select the month from the dropdown (e.g., "November 2025")
3. Click **Generate Salary** button
4. The system will:
   - Calculate salary for all active employees
   - Include base salary
   - Add applicable allowances
   - Add overtime pay (if any)
   - Deduct applicable deductions
   - Create salary payment records

### Viewing Salary Records

1. Click **Salary** in the sidebar
2. Use filters to narrow down results:
   - **Month** - Select specific month
   - **Status** - Pending, Paid, or Cancelled
   - **Employee** - Filter by specific employee
3. Each salary record shows:
   - Employee Name
   - Month
   - Total Amount
   - Status
   - Payment Date (if paid)

### Viewing Salary Breakdown

To see detailed breakdown of a salary payment:

1. Click on a salary record
2. The breakdown will show:
   - **Base Salary** - Monthly base amount
   - **Allowances** - Each allowance with amount and details
   - **Overtime Pay** - Hours worked and amount
   - **Deductions** - Each deduction with amount and details
   - **Total Amount** - Net salary to be paid

### Processing Salary Payments

**Admin and Manager only**

1. Click on a salary record with "Pending" status
2. Click **Mark as Paid** button
3. Select **Payment Method**:
   - Bank Transfer
   - Cash
   - Cheque
4. Select **Payment Date** (defaults to today)
5. Add **Notes** if needed (optional)
6. Click **Confirm Payment**
7. The status will change to "Paid"

### Cancelling Salary Payments

1. Click on a salary record
2. Click **Cancel Payment** button
3. Confirm the cancellation
4. The status will change to "Cancelled"

### Exporting Salary Records

You can export salary records to:
- **CSV** - For Excel/spreadsheet analysis
- **PDF** - For printing and reports

1. Filter the salary records as needed
2. Click the **Export** button
3. Select format (CSV or PDF)
4. The file will be downloaded

---

## Overtime Management

### Adding Overtime Records

**Admin and Manager only**

1. Click **Overtime** in the sidebar
2. Click **Add Overtime** button
3. Fill in the details:
   - **Employee** - Select from dropdown
   - **Month** - Select the month (e.g., "2025-11")
   - **Hours** - Number of overtime hours worked
   - **Rate** - Hourly rate in PKR (defaults to employee's hourly rate)
   - **Description** - Optional notes
4. Click **Save**

### Viewing Overtime Records

1. Click **Overtime** in the sidebar
2. Use filters:
   - **Employee** - Filter by specific employee
   - **Month** - Filter by month
3. View overtime records with:
   - Employee Name
   - Month
   - Hours Worked
   - Hourly Rate
   - Total Amount
   - Date Added

### Editing Overtime Records

1. Click on an overtime record
2. Click **Edit**
3. Modify the information
4. Click **Save**

### Deleting Overtime Records

1. Click on an overtime record
2. Click **Delete** button
3. Confirm deletion

**Note:** Overtime is automatically included in salary calculations when generating monthly salaries.

---

## Deductions & Allowances

### Managing Deductions

**Admin and Manager only**

#### Adding a Deduction Type

1. Click **Deductions** in the sidebar
2. Click **Add Deduction** button
3. Fill in the details:
   - **Name** - Deduction name (e.g., "Income Tax", "Insurance")
   - **Type** - Select from:
     - Tax
     - Insurance
     - Provident Fund
     - Loan
     - Other
   - **Calculation Method:**
     - **Fixed Amount** - Enter fixed amount in PKR
     - **Percentage** - Enter percentage of base salary
   - **Status** - Active or Inactive
4. Click **Save**

#### Assigning Deduction to Employee

1. Go to **Employees**
2. Click on an employee
3. Scroll to **Deductions** section
4. Click **Add Deduction**
5. Select the deduction type
6. Set the amount or percentage (if not already set globally)
7. Click **Save**

### Managing Allowances

**Admin and Manager only**

#### Adding an Allowance Type

1. Click **Allowances** in the sidebar
2. Click **Add Allowance** button
3. Fill in the details:
   - **Name** - Allowance name (e.g., "Housing Allowance", "Transport")
   - **Type** - Select from:
     - Bonus
     - Shift Premium
     - Travel
     - Housing
     - Meal
     - Other
   - **Calculation Method:**
     - **Fixed Amount** - Enter fixed amount in PKR
     - **Percentage** - Enter percentage of base salary
   - **Location Based** - Enable if allowance depends on distance/location
   - **Minimum Distance** - Required distance in km (if location based)
   - **Status** - Active or Inactive
4. Click **Save**

#### Assigning Allowance to Employee

1. Go to **Employees**
2. Click on an employee
3. Scroll to **Allowances** section
4. Click **Add Allowance**
5. Select the allowance type
6. Set the amount or percentage (if not already set globally)
7. Click **Save**

**Note:** Deductions and allowances are automatically included in salary calculations.

---

## User Management

**Admin only**

### Viewing Users

1. Click **Users** in the sidebar
2. View list of all system users with:
   - Username
   - Email
   - Role (Admin, Manager, Viewer)
   - Created Date

### Creating a New User

1. Click **Users** in the sidebar
2. Click **Create User** button
3. Fill in the user information:
   - **Username** - Unique username for login
   - **Email** - User's email address
   - **Password** - Initial password (user should change after first login)
   - **Role** - Select role (Admin, Manager, or Viewer)
4. Click **Create User**

### Deleting a User

1. Click **Users** in the sidebar
2. Click on the user you want to delete
3. Click **Delete User** button
4. Confirm deletion

**Warning:** You cannot delete your own user account while logged in.

---

## Settings

### Changing Your Password

1. Click **Settings** in the sidebar
2. Fill in the password change form:
   - **Current Password** - Your existing password
   - **New Password** - Your new password (minimum 6 characters)
   - **Confirm New Password** - Re-enter new password
3. Click **Change Password**
4. You'll see a success message

**Security Tips:**
- Use a strong password with mix of letters, numbers, and symbols
- Change password regularly
- Never share your password with others

---

## Common Workflows

### Monthly Salary Processing Workflow

**Step 1: Prepare Data**
1. Ensure all active employees are up to date
2. Add overtime records for the month
3. Review and update deductions/allowances if needed

**Step 2: Generate Salaries**
1. Go to **Salary** section
2. Select the current month
3. Click **Generate Salary**
4. Review the generated salary records

**Step 3: Review Individual Salaries**
1. Click on each salary record
2. Review the breakdown:
   - Base Salary
   - Allowances
   - Overtime
   - Deductions
   - Net Amount
3. Make corrections if needed

**Step 4: Process Payments**
1. After salary approval, mark each salary as "Paid"
2. Select payment method and date
3. Add notes if required
4. Confirm payment

**Step 5: Export Records**
1. Export salary records to CSV/PDF for accounting
2. Keep records for audit purposes

### Onboarding a New Employee

**Step 1: Create Employee Record**
1. Go to **Employees**
2. Click **Add Employee**
3. Fill in all required information
4. Set status to "Active"
5. Save the employee

**Step 2: Assign Allowances**
1. Open the employee record
2. Add applicable allowances (Housing, Transport, etc.)
3. Save changes

**Step 3: Assign Deductions**
1. In the same employee record
2. Add applicable deductions (Tax, Insurance, etc.)
3. Save changes

**Step 4: Verify Setup**
1. Go to **Salary** section
2. Run a test salary calculation for the employee's month
3. Review the breakdown to ensure correctness

### End of Month Reporting

**Step 1: Export Salary Data**
1. Go to **Salary** section
2. Filter by the completed month
3. Filter by status "Paid"
4. Export to CSV for accounting

**Step 2: Review Dashboard Metrics**
1. Go to **Dashboard**
2. Note down key metrics:
   - Total Monthly Payroll
   - Number of Employees Paid
   - Pending Payments

**Step 3: Generate Reports**
1. Export employee list if needed
2. Export overtime records for the month
3. Keep backup of all data

---

## Tips and Best Practices

### Data Entry
- Always use consistent formats for Employee IDs (e.g., EMP001, EMP002)
- Double-check CNIC and bank account numbers
- Verify email addresses for accuracy

### Salary Processing
- Generate salaries only once per month to avoid duplicates
- Review breakdown before marking as paid
- Keep payment notes for audit trail

### Security
- Change default admin password immediately
- Create separate user accounts for each staff member
- Assign appropriate role based on responsibilities
- Never share login credentials

### Backup
- Regularly export data to CSV
- Keep backup of employee records
- Maintain audit trail of salary payments

---

## Troubleshooting

### Cannot Login
- Verify username and password are correct
- Password is case-sensitive
- Clear browser cache and try again
- Contact administrator for password reset

### Salary Not Showing Breakdown
- Delete the salary record
- Regenerate salary for that month
- The breakdown will appear with the new record

### Cannot Generate Salary
- Check if employees are marked as "Active"
- Verify you have required permissions (Admin or Manager)
- Check if salary already exists for that month/employee

### Changes Not Saving
- Check your internet connection
- Verify you have required permissions
- Try logging out and logging back in
- Check browser console for errors (F12)

---

## Support

For technical issues or questions:
- Check this user guide first
- Review system logs if you're an administrator
- Contact your system administrator
- Report bugs on the GitHub repository

---

**PayVault - Employee Salary Management System**
Version 1.0 | Last Updated: November 2025
