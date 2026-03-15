# Large Dataset Export (1M+ Rows)

- A production-ready solution for exporting 1M+ row datasets from database to CSV without compromising database performance or user experience.

- Core Challenge Solved: Traditional pagination (OFFSET/LIMIT) causes full table scans and degrades performance as datasets grow. This implementation uses cursor-based streaming with background job processing to handle massive exports efficiently while maintaining a responsive UI.

- The export process runs **asynchronously using BullMQ** and reads data **in batches using cursor-based pagination**, avoiding full table scans.

---

# Project Structure

```
.
├── app
│   ├── api
│   │   ├── export
│   │   ├── export-download
│   │   ├── export-status
│   │   └── users
│   ├── queue
│   └── worker
├── components
├── lib
│   ├── db.ts
│   └── redis.ts
├── prisma
│   ├── migrations
│   ├── schema.prisma
│   └── seed.ts
├── docker-compose.yml
├── dockerfile
└── README.md
```

---

# Tech Stack

* Next.js
* PostgreSQL
* Prisma ORM
* Redis
* BullMQ
* Docker

---

# Export Behaviour

When the Export button is clicked:
- An export job is created and added to the BullMQ queue.
- A background worker starts processing the export in batches using cursor-based pagination.
- The frontend polls the export status every 2–3 seconds.
- Once the export job status becomes COMPLETE, the generated CSV file is automatically downloaded.
- This approach ensures the export runs asynchronously without blocking the API or overwhelming the database.

> [!IMPORTANT]
> Use the **Status** tab to monitor the progress of the CSV generation and download the file once it is available.

---
# Running the Project

### 1. Clone repository

```
git clone https://github.com/A-ryan-Kalra/large-dataset
cd large-dataset
```

### 2. Start containers

```
docker compose up --build
```

This starts:

* Next.js server
* PostgreSQL
* Redis
* Worker

### 3. Seed database If running without docker (generates 1M rows)

```
npx prisma db seed
```

Application runs at:

```
http://localhost:3000
```

---

# Key Design Decisions

**Cursor Pagination**

Instead of using `OFFSET`, the system uses cursor-based pagination:

```sql
SELECT id, first_name, last_name, email, country
FROM "user"
WHERE id > $cursor
ORDER BY id ASC
LIMIT $batchSize
```

This avoids full table scans and keeps queries efficient even with millions of rows.

**Batch Processing**

The worker reads rows in batches(Eg. 1000) and appends them to the CSV file, keeping memory usage low.

**Background Job Processing**

Exports run through a BullMQ queue so API requests remain fast and the database is not overloaded.

**Resumable Export**

Each export job stores the last processed cursor.
If the worker fails, the job can resume from the last processed row.

```
If no rows returned
  BREAK LOOP

For each row in result
  Convert row to CSV format

Append row to file
  Track lastIdInBatch

Update cursor
  cursor = lastIdInBatch

Persist cursor in export_job table
  update last_exported_id
```

---


# Export Flow

1. User applies filters on the dataset
2. API creates an export job
3. BullMQ worker processes the job
4. Data is read in batches using cursor pagination
5. CSV file is generated
6. User downloads the exported file

---
