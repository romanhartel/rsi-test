//****************************************************************

/**
 * Command message to handle an event reminder with a name and a specific time.
 */

//****************************************************************

import { v4 as uuid_v4 } from 'uuid';

//****************************************************************

export default class CommandMessage
{
    public uuid: string;
    public name: string;
    public time: number;
    public expiration: number;

    /**
     * Gets an incoming message (once decoded) as input.
     * A unique id is associated with each new command message in order to keep them all
     * ie. in case of identical keys for separate messages would result in messages being overridden.
     *
     * @param jsonCommand Incoming message in JSON format like so {"name":"blabla","time":"1626097620"}. Gets parsed before being injected.
     */

    public constructor(jsonCommand: string)
    {
        const command: any = JSON.parse(jsonCommand);

        console.log(command);

        this.uuid = uuid_v4();
        this.name = command.name;
        this.time = command.time;
        this.expiration = -1;
    }

    /**
     * Tests whether the time associated to an incoming message is in the future (and therefore is valid) or not.
     *
     * @returns boolean
     */

    public isValid(): boolean
    {
        const now: number = Math.round(Date.now() / 1000);

        this.expiration = this.time - now;

        return this.expiration > 0 ? true : false;
    }
}
