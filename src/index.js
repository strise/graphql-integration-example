const gql = require('graphql-tag')
const clientPromise = require('./client')


async function queryAndHandleException(query, variables) {
  const client = await clientPromise
  try {
    return await client.query({query, variables})
  } catch (error) {
    console.log(JSON.stringify(error))
  }
}

const PORTFOLIOS = gql`
query {
  currentUser {
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
  }
}`
async function getPortfolios() {
  const response = await queryAndHandleException(PORTFOLIOS)
  if (!response) return
  console.log(response)
}


const COMPANIES = gql`
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
  const response = await queryAndHandleException(COMPANIES, {searchQuery: searchQuery})
  if (!response) return
  console.log('getCompanies', response.data.companies.edges)
}


const COUNTRIES = gql`
query countries($q: String) {
  countries(q: $q first: 20) {
    edges {
      node {
        id
        name
      }
    }
  }
}
`
async function getCountries(searchQuery) {
  const response = await queryAndHandleException(COUNTRIES, {q: searchQuery})
  if (!response) return
  console.log('Countries', response.data.countries.edges)
}

const norwayId = 'Q20'
const TRENDING_COMPANIES_IN_COUNTRY = gql`
query trendingCompaniesInCountry($country: ID! $from: ISODateTime! $to: ISODateTime!) {
  trendingCompanies(locations: [$country] from: $from to: $to) {
    edges {
      node {
        id
        name
      }
    }
  }
}
`

async function getTrendingInCountry(countryId) {
  const now = new Date()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const response = await queryAndHandleException(TRENDING_COMPANIES_IN_COUNTRY, {country: countryId, from: oneWeekAgo, to: now})
  if (!response) return
  console.log(response)
}

getPortfolios()
getCompanies('Strise.ai')
getCountries('norway')
getTrendingInCountry(norwayId)
