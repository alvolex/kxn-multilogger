import router from "@sitevision/api/common/router";
import appData from "@sitevision/api/server/appData";
import endecUtil from "@sitevision/api/server/EndecUtil";
import fileUtil from "@sitevision/api/server/FileUtil";
import privileged from "@sitevision/api/server/privileged";
import type { Node } from "@sitevision/api/types/javax/jcr/Node";

const LOG_FILE_NAME = "log.txt";

const createLogFile = (
  logFolder: Node,
  loggingAppName: string,
  errorLog: string,
  logType: ErrorTypes = ErrorTypes.ERROR
) => {
  const jsonToLog = [
    {
      date: new Date().toISOString(),
      loggingAppName,
      errorLog,
      logType,
    },
  ];

  const jsonToBase64 = JSON.stringify(jsonToLog);
  const base64 = endecUtil.base64encode(jsonToBase64);

  fileUtil.createFileFromBase64(logFolder, LOG_FILE_NAME, base64);
  return "Logfile created";
};

const getLogFile = (logFolder: Node) => {
  let logFile = null as any as Node;
  const allFiles = logFolder.getNodes();

  while (allFiles.hasNext()) {
    const curFile = allFiles.next() as Node;
    const fileName = curFile.getName();
    if (fileName === LOG_FILE_NAME) {
      logFile = curFile;
      break;
    }
  }

  return logFile;
};

const updateLogFile = (
  logFile: Node,
  errorLog: string,
  loggingAppName: string,
  logType: ErrorTypes = ErrorTypes.ERROR
) => {
  const updatedLog = JSON.parse(fileUtil.getContentAsString(logFile));
  const newLog = {
    date: new Date().toISOString(),
    loggingAppName,
    errorLog,
    logType,
  };
  updatedLog.push(newLog);
  const jsonToBase64 = JSON.stringify(updatedLog);
  const base64 = endecUtil.base64encode(jsonToBase64);

  fileUtil.updateBinaryContentFromBase64(logFile, base64);
};

enum ErrorTypes {
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

const updateLogContents = (
  logFolder: Node,
  loggingAppName: string,
  errorLog: string,
  logType: ErrorTypes = ErrorTypes.ERROR
) => {
  try {
    const logFile = getLogFile(logFolder);

    if (!logFile) {
      createLogFile(logFolder, loggingAppName, errorLog, logType);
      return "Logfile created";
    }

    updateLogFile(logFile, errorLog, loggingAppName, logType);

    return JSON.parse(fileUtil.getContentAsString(logFile));
  } catch (error) {
    return (
      "something went wrong" +
      error +
      " Priv: " +
      privileged.isConfigured() +
      " logfolderName: " +
      logFolder.getName()
    );
  }
};

const structuredLogData = () => {
  const logFolder = appData.getNode("logFolder");
  const logFile = getLogFile(logFolder);
  const data = JSON.parse(fileUtil.getContentAsString(logFile));

  const structuredData = data.reduce((acc: any, log: any) => {
    const { loggingAppName } = log;
    if (!acc[loggingAppName]) {
      acc[loggingAppName] = [];
    }
    acc[loggingAppName].push(log);
    return acc;
  }, {});
  return structuredData;
};

router.get("/getLogFile", (req, res) => {
  privileged.doPrivilegedAction(() => {
    const logFolder = appData.getNode("logFolder");
    const logFile = getLogFile(logFolder);

    if (!logFile) {
      res.json({ logContents: "No log file found" });
      return;
    }

    const data = JSON.parse(fileUtil.getContentAsString(logFile));
    res.json({ allLogs: data, structuredData: structuredLogData() });
  });
});

function isValidEnumValue(enumObj: any, value: string): boolean {
  for (const key in enumObj) {
    if (enumObj[key] === value) {
      return true;
    }
  }
  return false;
}

router.post("/updateLog", (req, res) => {
  privileged.doPrivilegedAction(() => {
    const logFolder = appData.getNode("logFolder");

    let logType = req.params?.logType as ErrorTypes;
    if (!logType || !isValidEnumValue(ErrorTypes, logType)) {
      logType = ErrorTypes.ERROR;
    }

    const data = updateLogContents(
      logFolder,
      req.params.loggingAppName,
      req.params.errorLog,
      logType
    );

    res.json({ allLogs: data });
  });
});
