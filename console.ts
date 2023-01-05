import { load, start } from "infinitymint";
import { getConfigFile, isEnvTrue } from "infinitymint/dist/app/helpers";

const config = getConfigFile();
if ((config.console || isEnvTrue("INFINITYMINT_CONSOLE")) && !config.startup)
  start();

if (config.startup) load();
