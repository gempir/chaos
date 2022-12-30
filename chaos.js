import { gql, GraphQLClient } from 'graphql-request';
import fs from 'fs';

const cfg = JSON.parse(fs.readFileSync('config.json'));

const gqlUrl = "https://api.7tv.app/v3/gql";
const graphQLClient = new GraphQLClient(gqlUrl, {
    headers: {
        authorization: 'Bearer ' + cfg.seventvToken,
    },
});

async function addEmote(emoteID) {
    const query = gql`
mutation addEmote($emoteSet: ObjectID!, $emoteId: ObjectID!) {
	emoteSet(id: $emoteSet) {
		emotes(id: $emoteId, action: ADD) {
			id
			name
		}
	}
}
  `;
    const variables = { emoteSet: cfg.emoteSetID, emoteId: emoteID };

    const data = await graphQLClient.request(query, variables);
}

async function getEmotes(page) {
    const query = gql`
query SearchEmotes($query: String!, $page: Int, $sort: Sort, $limit: Int, $filter: EmoteSearchFilter) {\n  emotes(query: $query, page: $page, sort: $sort, limit: $limit, filter: $filter) {\n    count\n    items {\n      id\n      name\n      states\n      trending\n      owner {\n        id\n        username\n        display_name\n        style {\n          color\n          paint_id\n          __typename\n        }\n        __typename\n      }\n      flags\n      host {\n        url\n        files {\n          name\n          format\n          width\n          height\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}
    `;

    const variables = {
        "query": "",
        "limit": 56,
        "page": page,
        "sort": {
            "value": "popularity",
            "order": "DESCENDING"
        },
        "filter": {
            "category": "TOP",
            "exact_match": false,
            "case_sensitive": false,
            "ignore_tags": false,
            "zero_width": false,
            "animated": false,
            "aspect_ratio": ""
        }
    }

    const data = await graphQLClient.request(query, variables);

    return data.emotes.items.map((emote) => emote.id);
}


// start with page 20
for (let i = 20; i < 120; i++) {
    const emoteIds = await getEmotes(i);
    console.log("Adding", emoteIds.length, "emotes from page", i);
    for (const emoteId of emoteIds) {
        await addEmote(emoteId).catch((error) => console.error("fail", emoteId, error.response.errors[0].message));
        await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 5000));
}