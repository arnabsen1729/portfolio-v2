export interface Quote {
  text: string;
  author: string;
  attribution?: string;
}

// Curated for being technical, cryptic, or provocative rather than
// motivational — the kind of line that makes a reader stop and wonder
// what the author actually meant.
export const quotes: Quote[] = [
  {
    text: 'With four parameters I can fit an elephant, and with five I can make him wiggle his trunk.',
    author: 'John von Neumann',
    attribution: 'as recounted by Freeman Dyson',
  },
  {
    text: 'Anyone who considers arithmetical methods of producing random digits is, of course, in a state of sin.',
    author: 'John von Neumann',
    attribution: '1951',
  },
  {
    text: 'The models just want to learn.',
    author: 'Ilya Sutskever',
    attribution: 'as recounted by Dario Amodei',
  },
  {
    text: 'The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin.',
    author: 'Rich Sutton',
    attribution: 'The Bitter Lesson, 2019',
  },
  {
    text: 'Machines take me by surprise with great frequency.',
    author: 'Alan Turing',
    attribution: '1950',
  },
  {
    text: 'The question of whether machines can think is about as relevant as the question of whether submarines can swim.',
    author: 'Edsger W. Dijkstra',
  },
  {
    text: 'Beware of bugs in the above code; I have only proved it correct, not tried it.',
    author: 'Donald Knuth',
    attribution: '1977',
  },
  {
    text: "A distributed system is one in which the failure of a computer you didn't even know existed can render your own computer unusable.",
    author: 'Leslie Lamport',
  },
  {
    text: 'I call it my billion-dollar mistake. It was the invention of the null reference in 1965.',
    author: 'Tony Hoare',
  },
  {
    text: 'Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it.',
    author: 'Brian Kernighan',
  },
  {
    text: 'A year spent in artificial intelligence is enough to make one believe in God.',
    author: 'Alan Perlis',
    attribution: 'Epigrams on Programming, 1982',
  },
  {
    text: 'Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations.',
    author: 'Melvin Conway',
    attribution: '1967',
  },
  {
    text: "In mathematics you don't understand things. You just get used to them.",
    author: 'John von Neumann',
  },
];
