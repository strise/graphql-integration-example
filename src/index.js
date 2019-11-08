const gql = require('graphql-tag')
const clientPromise = require('./client')

// Helper function that wraps the ApolloClient and handles errors
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
                name
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
  const portfolios = response.data.currentUser.portfolios.edges.map((edge) => edge.node)
  return portfolios
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
  const companies = response.data.companies.edges.map((edge) => edge.node)
  return companies
}

const COMPANY_AND_EVENTS = gql`
query companyAndEvents($id: ID! $languages: [Language!] $from: ISODateTime! $to: ISODateTime!) {
  company(id: $id) {
    id
    name
    events(from: $from to: $to languageFilter: $languages) {
      edges {
        summary {
          text
        }
        node {
          title
          publisher
          published
        }
      }
      histogram(interval: DAY timeZone: "Europe/Oslo") {
        values {
          value
          time
        }
      }
    }
  }
}`
async function getCompanyAndEvents(companyId) {
  const now = new Date()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const response = await queryAndHandleException(COMPANY_AND_EVENTS, {id: companyId, from: oneWeekAgo, to: now, languages: ["NORWEGIAN"]})
  if (!response) return
  const companyAndEvents = response.data.company
  return companyAndEvents
}

async function main() {
  const portfolios = await getPortfolios()
  if (portfolios.length === 0) return

  // Take the first portfolio
  const firstPortfolio = portfolios[0]

  // Find the companies for this portfolio
  const firstPortfolioCompanies = firstPortfolio.companies.edges.map((edge) => edge.node)

  for (const company of firstPortfolioCompanies) {
    const companyId = company.id
    console.log('Fetching events for: ', company.name, '.....')
    const companyAndEvents = await getCompanyAndEvents(companyId)
    console.log(JSON.stringify(companyAndEvents, null, 2))
  }
}

main()
