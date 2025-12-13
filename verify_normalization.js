const normalizeText = (text) => {
    return text
        .normalize('NFD') // Decompose accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
        .replace(/[#@!$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, ' ') // Replace special chars with space
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
};

const tests = [
    "Book #1",
    "Gatsby le Magnifique",
    "L'Étranger",
    "Café & Cigarettes",
    "Harry Potter - and the Prisoner of Azkaban",
    "[Special] Edition",
    "Molière"
];

console.log("Original -> Normalized");
console.log("----------------------");
tests.forEach(t => {
    console.log(`"${t}" -> "${normalizeText(t)}"`);
});
