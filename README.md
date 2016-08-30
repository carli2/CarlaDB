# CarlaDB
CarlaDB is a in-memory column store with a fast execution engine for analytic code. It is ment as a direct competitor to SAP HANA with the difference that it is licenced under GPLv3. The goal is to create an Open Source alternative to SAP HANA.

CarlaDB intends to become the fastest In-Memory Database ever by using aggressive query caching and query compilation via LLVM.

## Compile and run

SQL frontend (written in Node.js):
 `cd src/sql-nodejs; npm install; make`

## Design

CarlaDB's design is inspired from the ERIS research project from TU Dresden (https://wwwdb.inf.tu-dresden.de/research-projects/projects/eris/). The basic idea of ERIS is to have a data management core which cares about inserting and updating data and is addressed with a low level programming interface. Multiple in-memory storage nodes (AEU, autonomous execution units) store parts of the data. AEUs communicate through fire-and-forget message passing.

### Storage

Data in CarlaDB is stored in a columnar fashion.
- Integers and fixed-size types are stored as a list of pairs (record-ID, value).
- Strings are stored in a dictionary. The table itself only stores a reference to the dictionary.
- Integers can be bit-compressed or also dictionary-compressed. Sorting is encouraged because this automatically builds an index.

### Main Storage vs Delta Storage

There are two storages: Main Storage and Delta Storage.

Main Storage:
- columnar storage
- readonly
- only committed data
- compressed and optimized data

Delta Storage:
- row storage, stored deletion commands
- append-only
- is merged into Main Storage whenever the size exceeds a certain limit
- may contain unfinished transactions

### Queries

Queries in CarlaDB are done in a kind of bytecode. This bytecode represents a lambda function that is shot into the network of nodes. As long as messages related to that query are around the network, the query is running. As soon as all messages are processed and no new messages are created, the query is completed.

### In-Storage Computation

CarlaDB offers widespread functions to do calculations directly in the database. Every query is basically code that is executed inside the database. This allows you to aggregate data in your own fashion, or create JSON strings directly in the database. The goal of this approach is to minimize data transport and move code directly to the data.

The computing model is similar to NodeJS's event based system. A action is invoked an a callback is deposited that shall be executed as soon as the data has arrived.

## Operations
CarlaDB's bytecode is a densely packed form of code that can be executed inside the system. Every piece of bytecode is preceeded with it's SHA256 checksum such that compiled bytecode can be cached. Similar to Java bytecode, CarlaDB's bytecode is executed on a virtual stack machine. Technically, it is translated to machine code using LLVM.

### Management operations
- Create Table
- Drop Table
- Set/Create/Alter Column (migrates data to new type if column already exists)
- Drop Column
- Begin, Commit, Abort transaction

### Data Manipulation Operations
- Insert
- Update
- Delete

### Data Scan Operations
CarlaDB uses a approach similar to lamba calulus. The _scan_ operation allows you to find data in a table and execute some code upon it. The code then can do things like filtering, mapping or storing the data into the result table.

## Multi Node operation
CarlaDB has a multithreaded design that can effectively handle large NUMA systems. Queries can be dispatched to any node in the system. Data in large tables is split over multiple nodes. When accessing those tables, the system distributes bytecode-based commands over the corresponding nodes. Hence, small tables that are often accessed are replicated over the network.

## Internal Data structures
- Table register: Maps table names to table IDs. In bytecode, string references to tables are translated to table IDs during compilation.
- Table relocation table: Stores which nodes have parts of the data of this table
- Column register: Maps column names to column IDs.
- Column Pool: The data!
- Bytecode cache: Map from SHA256sum to compiled machine code

## SQL, GraphQL, NoSQL frontends
Frontends basically translate incoming queries from a query language to bytecode that is sent to an execution engine. The execution opens a response channel that internal callbacks can write results to.
