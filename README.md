# FeastOn — Mess Coupon Management System

FeastOn is a digital coupon management platform built for IIIT Kottayam, 
replacing manual physical coupon distribution with a streamlined, 
QR-based system. Currently serving 3,000+ active students in production.

🌐 **Live at:** [feaston](http://feaston.iiitkottayam.ac.in)

## What It Does

**For Students**
- Login with college email ID
- View and register for active mess events within the registration window
- Receive a unique QR code upon registration

**For Admins**
- Create and manage mess events with defined timelines
- Generate temporary volunteer credentials and distribute them
- Control event access windows

**For Volunteers**
- Login via admin portal using temporary credentials
- Scan student QR codes at the venue
- Access automatically expires when the event window closes

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js |
| Database | PostgreSQL |
| DevOps | Docker, Linux, Bash, Git |
| Networking | DNS, firewalls, server administration |

## Architecture

Single-container deployment using a multi-stage Dockerfile:
1. Stage 1 builds the React frontend
2. Stage 2 runs the Node.js backend and serves the compiled frontend as static files
3. Deployed on IIIT Kottayam institutional servers behind institutional 
firewall and DNS

## Infrastructure

Deployed and maintained on college production servers by the DevOps owner:
- Containerised using Docker with a multi-stage build
- Coordinated with college IT for server access, firewall rules, 
and DNS setup for the institutional subdomain
- Primary on-call for production incidents across networking, 
container runtime, and application layers
- Environment-based configuration for inter-service communication

## Contributors

- **Frontend** — Sanjay S Subramaniam
- **Backend** — Ebin Thomas
- **DevOps & Infrastructure** — Nived Narayan
