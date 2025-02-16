const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const admin = require('firebase-admin');
const serviceAccount = require('./shinys-library-firebase-adminsdk.json');



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const schema = buildSchema(`
  type Book {
    id: ID!
    title: String!
    author: String!
    status: String!
  }

  type Query {
    books: [Book]
  }

  type Mutation {
    addBook(title: String!, author: String!, status: String!): Book
  }
`);

let books = [];

const root = {
    books: async () => {
        const snapshot = await db.collection('books').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    addBook: async ({ title, author, status }) => {
        const book = { title, author, status };
        const docRef = await db.collection('books').add(book);
        return { id: docRef.id, ...book };
    },
};

const app = express();

app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
}));

app.get('/', (req, res) => {
    res.send('Welcome to Shiny\'s Library Backend! Visit /graphql for the GraphQL interface.');
});
app.listen(4000, () => {
    console.log('Server running on http://localhost:4000');
});
