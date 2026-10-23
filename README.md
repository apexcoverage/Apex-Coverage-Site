# Apex Coverage – Marketing Site (Next.js + Tailwind)


A lightweight marketing site for **Apex Coverage** built with Next.js (App Router) and Tailwind CSS.


## Quick start


```bash
# 1) Install deps
npm install


# 2) Run locally
npm run dev
# open http://localhost:3000
```

## Internal employee setup

The employee sign-in is at `/employee-sign-in` and protects the agent dashboard,
customers, quotes, and their server APIs. All active employees can use those
areas. Managers and admins can edit quote rates; admins can add and manage
employee accounts from `/agent/team`.

Set `DATABASE_URL` to a PostgreSQL connection string in Vercel before using
Team management. Keep one existing admin in `APEX_EMPLOYEES_JSON` for the
one-time import on first database sign-in. After that, new accounts are created
in Team and activated using a one-time link. The database also keeps quote
history and rate matrix revisions across deployments. Without `DATABASE_URL`,
the existing environment-based sign-in and local quote store remain available,
but Team management and durable production history are unavailable.

Customer setup begins from the pipeline or an existing customer profile. It
saves information without activating coverage. Agents explicitly confirm
binding requirements before marking auto and build products active separately.
The Apps Script `Code.gs` and `FollowUps.gs` changes must be deployed in the
existing spreadsheet project so setup stops lead follow-up messages.
