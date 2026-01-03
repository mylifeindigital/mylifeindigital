# Series: *Markdown as a Language — Understanding remark & unified*

### **Session 1 — Why Markdown Is Not Just Text**

**Core question:** *What actually is Markdown, structurally?*

* What Markdown *looks like* vs what it *means*
* Why regex-based parsing breaks (nested structures, context)
* Markdown as a **language**, not a format
* Intro to the idea of parsing → AST → rendering
* Mental model: *HTML is not the goal — understanding is*

**Outcome:**
Stop treating Markdown as strings and start seeing it as syntax.

---

### **Session 2 — Parsing vs Rendering (The Compiler Model)**

**Core question:** *What happens between text input and output?*

* Lexing vs parsing (conceptually)
* What an **AST** is (and why it matters)
* Why “Markdown → HTML” is a lossy transformation
* How compilers think (input → tree → transforms → output)
* Where remark fits in this mental model

**Outcome:**
Understand *why* remark exists, not just *that* it exists.

---

### **Session 3 — unified: The Pipeline Engine**

**Core question:** *What is unified actually responsible for?*

* unified as a **processing pipeline**, not a markdown tool
* Processors, plugins, and transforms
* Why unified supports multiple syntaxes (markdown, HTML, etc.)
* The idea of chaining responsibility instead of monoliths
* How remark is “just one language” in unified

**Outcome:**
See unified as infrastructure, not magic.

---

### **Session 4 — From Markdown Text to mdast**

**Core question:** *What does Markdown look like as a tree?*

* Introduction to **mdast** (Markdown AST)
* Node types: root, heading, paragraph, list, code, etc.
* Depth, children, position, raw values
* How headings, lists, and blocks nest
* Why ASTs are safer than tokens for transformation

**Outcome:**
Read an AST and understand the document without seeing the markdown.

---

### **Session 5 — Walking Trees (Visiting Nodes Safely)**

**Core question:** *How do you inspect and transform structure?*

* Tree traversal concepts (visitors, depth-first)
* Finding specific node types
* Extracting sections from headings
* Grouping content under headings
* Avoiding brittle assumptions

**Outcome:**
Stop “searching text” and start *navigating structure*.

---

### **Session 6 — Frontmatter as Document Metadata**

**Core question:** *What belongs in metadata vs content?*

* Frontmatter parsing (why it’s separate)
* Content vs configuration
* Using frontmatter to define **document type**
* Schema validation per document type (conceptually)
* Treating frontmatter as the *contract* with your renderer

**Outcome:**
Clearly separate *what the document is* from *what it says*.

---

### **Session 7 — Headings as Semantic Boundaries**

**Core question:** *What are headings really for?*

* Headings as outline, not UI commands
* Building a document hierarchy from H2 / H3
* Section-based content modeling
* Using heading depth intentionally
* Why abusing headings causes future pain

**Outcome:**
Use headings as structure — not hacks.

---

### **Session 8 — Introducing Explicit Structure (Directives & Blocks)**

**Core question:** *How do documents express intent beyond prose?*

* Why prose alone can’t express UI intent
* The idea of **explicit blocks**
* Container vs leaf nodes
* Designing a minimal block vocabulary
* Keeping authoring readable while being machine-friendly

**Outcome:**
Design *content primitives*, not ad-hoc rules.

---

### **Session 9 — From AST to a Domain Content Model**

**Core question:** *What should your app actually consume?*

* Why you don’t want to render directly from mdast
* Designing a **domain-specific content model**
* Mapping markdown concepts → application concepts
* Making content layout-aware without coupling
* Preparing content for rendering, indexing, reuse

**Outcome:**
Create a clean seam between content and UI.

---

### **Session 10 — Rendering Is a Separate Concern**

**Core question:** *Where does Hono (or any renderer) fit?*

* Why rendering should be dumb
* Content model → layout → components
* Different document types, same content pipeline
* Server-side rendering vs static vs hybrid
* Keeping rendering swappable

**Outcome:**
Can change frameworks without rewriting content logic.

---

### **Session 11 — Validation, Constraints, and Guardrails**

**Core question:** *How do you prevent content drift?*

* Schema validation for frontmatter
* Enforcing required sections per doc type
* Detecting invalid structures early
* Failing fast vs rendering badly
* Content as a contract, not a suggestion

**Outcome:**
System becomes predictable and resilient.

---

### **Session 12 — Reflection: When Markdown Stops Being Enough**

**Core question:** *Where are the limits of this approach?*

* When markdown works beautifully
* When it starts creaking
* Why round-tripping is hard
* Signals you need a richer editor
* Why this journey still matters even if you outgrow markdown

**Outcome:**
Understand the *tradeoffs*, not just the tools.
