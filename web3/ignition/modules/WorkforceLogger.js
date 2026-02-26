import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("WorkforceLoggerModule", (m) => {
    const logger = m.contract("WorkforceLogger", []);
    return { logger };
});
