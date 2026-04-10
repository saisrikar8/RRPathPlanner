import { useMemo } from "react";

const KEYWORDS = new Set([
    "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
    "class", "const", "continue", "default", "do", "double", "else", "enum",
    "extends", "final", "finally", "float", "for", "if", "implements", "import",
    "instanceof", "int", "interface", "long", "native", "new", "package",
    "private", "protected", "public", "return", "short", "static", "super",
    "switch", "synchronized", "this", "throw", "throws", "transient", "try",
    "void", "volatile", "while", "null", "true", "false",
]);

const COLORS = {
    comment:    "#6A9955",
    string:     "#CE9178",
    annotation: "#DCDCAA",
    keyword:    "#569CD6",
    type:       "#4EC9B0",
    method:     "#DCDCAA",
    number:     "#B5CEA8",
    other:      "#D4D4D4",
};

function tokenize(code) {
    const tokens = [];
    let i = 0;

    while (i < code.length) {
        const ch = code[i];

        // Line comment
        if (ch === "/" && code[i + 1] === "/") {
            const start = i;
            while (i < code.length && code[i] !== "\n") i++;
            tokens.push({ t: "comment", s: code.slice(start, i) });
            continue;
        }

        // String literal
        if (ch === '"') {
            const start = i++;
            while (i < code.length && code[i] !== '"') {
                if (code[i] === "\\") i++;
                i++;
            }
            i++; // closing "
            tokens.push({ t: "string", s: code.slice(start, i) });
            continue;
        }

        // Annotation
        if (ch === "@") {
            const start = i++;
            while (i < code.length && /\w/.test(code[i])) i++;
            tokens.push({ t: "annotation", s: code.slice(start, i) });
            continue;
        }

        // Number
        if (/\d/.test(ch)) {
            const start = i;
            while (i < code.length && /[\d.]/.test(code[i])) i++;
            tokens.push({ t: "number", s: code.slice(start, i) });
            continue;
        }

        // Identifier / keyword / type / method
        if (/[a-zA-Z_$]/.test(ch)) {
            const start = i;
            while (i < code.length && /[\w$]/.test(code[i])) i++;
            const word = code.slice(start, i);

            if (KEYWORDS.has(word)) {
                tokens.push({ t: "keyword", s: word });
            } else if (/^[A-Z]/.test(word)) {
                tokens.push({ t: "type", s: word });
            } else {
                // peek past whitespace to check for `(`
                let j = i;
                while (j < code.length && code[j] === " ") j++;
                tokens.push({ t: code[j] === "(" ? "method" : "ident", s: word });
            }
            continue;
        }

        // Whitespace (preserve newlines and spaces as-is)
        if (/\s/.test(ch)) {
            const start = i;
            while (i < code.length && /\s/.test(code[i])) i++;
            tokens.push({ t: "ws", s: code.slice(start, i) });
            continue;
        }

        // Everything else — operators, braces, semicolons, dots
        tokens.push({ t: "other", s: ch });
        i++;
    }

    return tokens;
}

export function JavaHighlight({ code }) {
    const tokens = useMemo(() => tokenize(code), [code]);

    return (
        <>
            {tokens.map((tok, idx) => {
                const color = COLORS[tok.t];
                if (!color) return tok.s;
                return (
                    <span key={idx} style={{ color }}>
                        {tok.s}
                    </span>
                );
            })}
        </>
    );
}