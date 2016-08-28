import {ConnectionOptions} from "../../src/connection/ConnectionOptions";
import {createConnection} from "../../src/index";
import {Connection} from "../../src/connection/Connection";
import {DriverOptions} from "../../src/driver/DriverOptions";
import {EntitySchema} from "../../src/metadata/entity-schema/EntitySchema";

export interface TestingConnectionOptions {
    entities?: Function[];
    entitySchemas?: EntitySchema[];
    entityDirectories?: string[];
    secondaryConnections?: boolean;
    schemaCreate?: boolean;
    reloadAndCreateSchema?: boolean;
    skipMysql?: boolean;
    skipPostgres?: boolean;
}

export function closeConnections(connections: Connection[]) {
    return Promise.all(connections.map(connection => connection.isConnected ? connection.close() : undefined));
}

export function createTestingConnectionOptions(type: "mysql"|"mysqlSecondary"|"postgres"|"postgresSecondary"): DriverOptions {
    const parameters = require(__dirname + "/../../../../config/parameters.json"); // path is relative to compile directory
    // const parameters = require(__dirname + "/../../config/parameters.json");

    const driverType: "mysql"|"postgres" = type === "mysql" || type === "mysqlSecondary" ? "mysql" : "postgres";
    return {
        type: driverType,
        host: parameters.connections[type].host,
        port: parameters.connections[type].port,
        username: parameters.connections[type].username,
        password: parameters.connections[type].password,
        database: parameters.connections[type].database,
        extra: {
            max: 500
        }
    };
}

export async function setupTestingConnections(options?: TestingConnectionOptions): Promise<Connection[]> {
    
    const mysqlParameters: ConnectionOptions = {
        name: "mysqlPrimaryConnection",
        driver: createTestingConnectionOptions("mysql"),
        autoSchemaCreate: options && options.entities ? options.schemaCreate : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };
    
    const mysqlSecondaryParameters: ConnectionOptions = {
        name: "mysqlSecondaryConnection",
        driver: createTestingConnectionOptions("mysqlSecondary"),
        autoSchemaCreate: options && options.entities ? options.schemaCreate : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const postgresParameters: ConnectionOptions = {
        name: "postgresPrimaryConnection",
        driver: createTestingConnectionOptions("postgres"),
        autoSchemaCreate: options && options.entities ? options.schemaCreate : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const postgresSecondaryParameters: ConnectionOptions = {
        name: "postgresSecondaryConnection",
        driver: createTestingConnectionOptions("postgresSecondary"),
        autoSchemaCreate: options && options.entities ? options.schemaCreate : false,
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        },
    };

    const mysql = !options || !options.skipMysql;
    const postgres = false; // !options || !options.skipPostgres;

    const allParameters: ConnectionOptions[] = [];
    if (mysql)
        allParameters.push(mysqlParameters);
    if (postgres)
        allParameters.push(postgresParameters);
    if (mysql && options && options.secondaryConnections)
        allParameters.push(mysqlSecondaryParameters);
    if (postgres && options && options.secondaryConnections)
        allParameters.push(postgresSecondaryParameters);
    
    return Promise.all(allParameters.map(async parameters => {
        const connection = await createConnection(parameters);
        if (options && options.reloadAndCreateSchema)
            await connection.syncSchema(true);

        return connection;
    }));
}

/**
 * @deprecated
 */
export function setupConnection(callback: (connection: Connection) => any, entities: Function[]) {

    const parameters: ConnectionOptions = {
        driver: {
            type: "mysql",
            host: "192.168.99.100",
            port: 3306,
            username: "root",
            password: "admin",
            database: "test"
        },
        autoSchemaCreate: true,
        entities: entities
    };

    return function() {
        return createConnection(parameters)
            .then(connection => {
                if (callback)
                    callback(connection);
                return connection;
            })
            .catch(e => {
                console.log("Error during connection to db: " + e);
                throw e;
            });
    };
}

export function reloadDatabases(connections: Connection[]) {
    return Promise.all(connections.map(connection => connection.syncSchema(true)));
}

/**
 */
export function reloadDatabase(connection: Connection) {
    return function () {
        return connection.syncSchema(true)
            .catch(e => console.log("Error during schema re-creation: ", e));
    };
}