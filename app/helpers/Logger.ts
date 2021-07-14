//****************************************************************

/**
 * Just a logger (console output only for now)
 */

//****************************************************************

import log from 'loglevel';

//****************************************************************

export enum logLevel
{
    error   = 'ERROR',
    warn    = 'WARN',
    debug   = 'DEBUG',
    info    = 'INFO',
    trace   = 'TRACE'
}

//****************************************************************

log.enableAll();

//****************************************************************

export default class Logger
{
    static setDefaultLevel(logLevel: logLevel) {
        log.setDefaultLevel(logLevel);
    }

    static error(tag: string, logText: string) {
        log.error(this.base(tag, logText, logLevel.error));
    }

    static warn(tag: string, logText: string) {
        log.warn(this.base(tag, logText, logLevel.warn));
    }

    static debug(tag: string, logText: string) {
        log.debug(this.base(tag, logText, logLevel.debug));
    }

    static info(tag: string, logText: string) {
        log.info(this.base(tag, logText, logLevel.info));
    }

    private static base(tag: string, logText: string, logLevel: logLevel) {
        return `${new Date().toISOString()} [${logLevel}][${tag}] PID ${process.pid} | ${logText}`;
    }
}
