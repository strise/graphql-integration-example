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
// This is NOT how mutations / queries should be specified, just done for simplicity in this example.
// See graphql-tag on GitHub/Google for how it should be done
const getAccessTokenQuery = `
mutation getAccessToken($clientId: String! $clientSecret: String!) {
  generateClientAccessToken(clientId: $clientId clientSecret: $clientSecret) {
    token
    expires
  }
}`

// The URI of the specified API to use / authenticate against
const uri = 'API_URI'

async function getAccessToken() {
  // Use simple fetch to get the accessToken
  const responsePromise = fetch(uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    // Stringify an object containing the query and variables
    body: JSON.stringify({query: getAccessTokenQuery, variables: {clientId: clientId, clientSecret: clientSecret}})
  })

  // Extract the accessToken from the response
  const response = await responsePromise
  const responseJson = await response.json()
  return responseJson.data.generateClientAccessToken
}

async function getApolloClient() {
  const accessToken = await getAccessToken()

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

  // Create the client - You can now use the GraphL Apollo Client freely!
  const client = new ApolloClient({link: link, cache: cache})

  return client
}

const clientPromise = getApolloClient()

// Define a GraphQL query using gql from graphql-tag
const GET_PORTFOLIOS = gql`
query portfolios {
  portfolios {
    edges {
      node {
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
  }
}`

// Define an async function to getPortfolios
async function getPortfolios() {
  const client = await clientPromise
  const response = await client.query({query: GET_PORTFOLIOS})
  console.log('getPortfolios', response.data.portfolios.edges)
}

// Call the function to get portfolios
getPortfolios()

const GET_COMPANIES = gql`
query companies($searchQuery: String!) {
  companies(q: $searchQuery) {
    edges {
      node {
        id
        name
      }
    }
  }
}`
async function getCompanies(searchQuery) {
  const client = await clientPromise
  const response = await client.query({query: GET_COMPANIES, variables: {searchQuery: searchQuery}})
  console.log('getCompanies', response.data.companies.edges)
}

getCompanies('Mito.ai')
