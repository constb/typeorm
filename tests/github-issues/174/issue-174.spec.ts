import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {Organisation} from "./entity/Organisation";
import {Contact} from "./entity/Contact";

describe("github issues > #174 Embeded types confusing with order by", () => {

    let connections: Connection[];
    beforeAll(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    afterAll(() => closeTestingConnections(connections));

    test("should order organisations correctly when properties are duplicate in its embeddable", () => Promise.all(connections.map(async connection => {

        const organisation1 = new Organisation();
        organisation1.name = "MilkyWay Co";
        organisation1.contact = new Contact();
        organisation1.contact.name = "Albert Cow";
        organisation1.contact.email = "ceo@mlkyway.com";
        await connection.manager.save(organisation1);

        const organisation2 = new Organisation();
        organisation2.name = "ChockoWay";
        organisation2.contact = new Contact();
        organisation2.contact.name = "Brendan Late";
        organisation2.contact.email = "ceo@chockoway.com";
        await connection.manager.save(organisation2);

        const organisations = await connection
            .getRepository(Organisation)
            .createQueryBuilder("organisation")
            .orderBy("organisation.name")
            .getMany();

        expect(organisations).not.toBeUndefined();
        expect(organisations)!.toEqual([{
            id: 2,
            name: "ChockoWay",
            contact: {
                name: "Brendan Late",
                email: "ceo@chockoway.com"
            }
        }, {
            id: 1,
            name: "MilkyWay Co",
            contact: {
                name: "Albert Cow",
                email: "ceo@mlkyway.com"
            }
        }]);
    })));

});