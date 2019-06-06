const gql = require('graphql-tag')
const fetch = require('node-fetch')
const { createHttpLink } = require('apollo-link-http')
const { ApolloClient } = require('apollo-client')
const { InMemoryCache } = require('apollo-cache-inmemory')

// In order to use the Mito API, one has to first get an access token
// To do so, call our API with the correct credentials

// Credentials
const clientId = 'CLIENT_ID'
const clientSecret = 'CLIENT_SECRET'

// Defining the mutation to get the token
// This is NOT how mutations / queries should be specified, just done for simplicity in the example. See graphql-tag on GitHub/Google
const getAccessToken = `
mutation getAccessToken($clientId: String! $clientSecret: String!) {
  generateClientAccessToken(clientId: $clientId clientSecret: $clientSecret) {
    token
    expires
  }
}`

// The URI of the specified API
const uri = 'API_URI'

// Use simple fetch to get the accessToken
const responsePromise = fetch(uri, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  // Manually insert the variables into the string
  body: JSON.stringify({query: getAccessToken, variables: {clientId: clientId, clientSecret: clientSecret}})
})

// Extract the accessToken from the response
const accessToken = responsePromise.then(response => {
  return response.json().then(json => {
    return json.data.generateClientAccessToken
  })
})

// The link to the API. If using node you have to pass fetch
// See how the header is set with the accessToken
const link = createHttpLink({
  uri: uri,
  headers: {
    authorization: `Bearer ${accessToken.token}`
  },
  fetch: fetch
})

// Create a cache to be used by the client
const cache = new InMemoryCache()

// Create the client
const client = new ApolloClient({link: link, cache: cache})

// You can now use the GraphL Apollo Client freely!
const GET_PORTFOLIOS = gql`
query portfolios {
  portfolios {
    id
    name
    companies {
      edges {
        node {
          id
          name(language: NORWEGIAN)
        }
      }
    }
  }
}
`

const portfoliosPromise = client.query({query: GET_PORTFOLIOS})
portfoliosPromise.then(console.log)
