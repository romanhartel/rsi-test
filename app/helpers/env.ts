export const env = (name: string) => {

    const value = process.env[name];

    if (value === undefined) {

        throw new EnvironmentException(`Found no environment variable for ${name}`);

    }

    return value;

};

export class EnvironmentException extends Error {}
