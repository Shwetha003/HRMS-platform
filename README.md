# RizeOS: AI-Powered HRMS platform with Web3 logging

An intelligent Human Resource Management System (HRMS) built to optimize team productivity, manage tasks, and leverage blockchain technology for secure, immutable task logging.

## ✨ Key Features

*   **Role-Based Access Control (RBAC):** Distinct dashboards and capabilities for Admins and Employees.
*   **Organization Management:** Multi-tenant architecture allowing users to register or join specific organizations.
*   **AI Smart Task Assignment:** A custom Workload Velocity & Decay Algorithm that recommends the best employee for a task based on:
    *   **Skill Match ($M$):** Matching task requirements with employee skills.
    *   **Reliability Index ($R$):** The employee's track record of completing tasks on time.
    *   **Velocity ($V$):** The rate at which an employee completes tasks.
    *   **Active Workload ($W$):** The current number of open tasks assigned to the employee.
*   **Productivity Scoring:** Dynamic productivity scores (0-100) calculated for each employee based on historical task completion and reliability.
*   **Web3 Integration:** Securely logs completed tasks to the **Polygon Amoy testnet** using a custom Solidity smart contract, providing an immutable record of work.
*   **Modern UI/UX:** A responsive, beautiful interface built with React, Tailwind CSS, and Framer Motion for smooth animations and interactions.

## 🛠️ Technology Stack

**Frontend:**
*   React.js (Vite)
*   Tailwind CSS
*   Framer Motion (Animations)
*   Lucide React (Icons)
*   React Router v6
*   Axios
*   Ethers.js (Web3 provider)

**Backend:**
*   Node.js & Express.js
*   TypeScript
*   PostgreSQL
*   Prisma ORM
*   JWT Authentication & bcrypt
*   Custom AI Algorithm Logic

**Web3:**
*   Solidity (Smart Contracts)
*   Hardhat
*   Polygon Amoy Testnet Integration

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
*   Node.js (v18+ recommended)
*   PostgreSQL installed and running
*   MetaMask browser extension (for Web3 features)

### 1. Database Setup
1. Create a PostgreSQL database (e.g., `rizeos_db`).
2. Navigate to the `backend` directory: `cd backend`
3. Create a `.env` file from the example (if available) or create a new one: `touch .env`
4. **⚠️ IMPORTANT: Update your `.env` file** to match your local PostgreSQL database credentials:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@localhost:5432/rizeos_db?schema=public"
   JWT_SECRET="your_super_secret_jwt_key"
   ```
5. Run Prisma migrations to initialize the database schema:
   ```bash
   npx prisma migrate dev --name init
   ```

### 2. Backend Setup
1. Stay in the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The backend will run on http://localhost:5000*

### 3. Web3 / Smart Contract Setup (Optional but recommended)
If you want to use the local Hardhat network for testing blockchain features instead of the live Testnet:
1. Navigate to the `web3` directory: `cd ../web3`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local Hardhat node in a new terminal:
   ```bash
   npx hardhat node
   ```
4. In another terminal, compile and deploy the contract to the local network:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
5. Copy the deployed contract address and update the `VITE_CONTRACT_ADDRESS` in the frontend `.env` file. To use the live Polygon Amoy testnet, simply ensure you have Amoy setup in MetaMask with test MATIC.

### 4. Frontend Setup
1. Navigate to the `frontend` directory: `cd ../frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. **⚠️ IMPORTANT: Create a `.env` file** in the `frontend` directory:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   # Optional: Set this to override the default Hardhat localhost address if testing Web3
   VITE_CONTRACT_ADDRESS="your_deployed_contract_address"
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on http://localhost:5173*

---

## 📖 Usage Guide

1. **Register as an Admin:** Open the frontend app and create a new organization. You will be assigned the `Admin` role.
2. **Add Employees:** Go to the "Employees" tab and add team members. They will default to a placeholder password (`password123`) which they can change on their profile.
3. **Create Tasks:** Navigate to the "Tasks" tab. When creating a task, use the **"Smart Assign"** button to see AI recommendations based on the workload velocity algorithm.
4. **Connect Wallet:** Employees can go to their Profile page and link their MetaMask wallet.
5. **Log Work on Chain:** When an employee moves a task exactly to the "Completed" status, MetaMask will prompt them to sign a transaction, permanently logging the achievement on the blockchain.

## 🧠 AI Algorithm Details: Workload Velocity & Decay

The Smart Assign feature calculates a final score ($S$) for every eligible employee to determine the best fit for a task.

$$ S = (M \times R) - (W \times V) $$

*   **$W$ (Active Workload Modifier):** Penalizes employees who already have too many open tasks.
*   **$V$ (Velocity Factor):** Measured by `average tasks completed per day / total tasks completed historical`. A high velocity implies the user completes tasks quickly.
*   **$M$ (Skill Match Multiplier):** A boost multiplier if the employee possesses the specific skills required for the task.
*   **$R$ (Reliability Index):** Calculates the percentage of tasks the employee has historically completed *before or on* their due date.

---

## 📄 License
This project is licensed under the MIT License.
