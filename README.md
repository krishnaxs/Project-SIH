# KrishiConnect

## Connecting Farmers Directly with Buyers
• KrishiConnect is a web-based agricultural marketplace developed to connect farmers directly with buyers.
• The platform aims to reduce dependency on intermediaries by providing a digital space where farmers can list
    their crops and buyers can explore available agricultural products and connect with farmers.
• This project is being developed as part of Smart India Hackathon (SIH).

---

## Problem Statement

Farmers often face several challenges in reaching potential buyers directly:
- Dependence on middlemen
- Limited market access
- Lack of price transparency
- Difficulty finding potential buyers
- Limited digital presence

• At the same time, buyers may find it difficult to connect directly with farmers and access information
    about available agricultural products.
• KrishiConnect addresses this problem by creating a digital platform that connects farmers and buyers in one place.

---

## Solution

• KrishiConnect provides separate functionality for farmers and buyers.
• Farmers can manage and list their agricultural products, while buyers can explore available crops
    and discover farmers.
• The platform focuses on creating a more direct and transparent connection between agricultural producers
    and consumers.

---

# Features

## Farmer Features
- User registration and authentication
- Farmer dashboard
- Add crop listings
- View listed crops
- Edit crop details
- Delete crop listings
- View total crop count
- Manage agricultural products

## Buyer Features
- Buyer dashboard
- Browse available crops
- View crop information
- View farmer information
- Discover available farmers
- Explore agricultural products

## Authentication
- User registration
- User login
- JWT-based authentication
- Protected routes
- Role-based access for farmers and buyers

---

# Technology Stack

## Framework
- Next.js

## Frontend
- React.js
- Tailwind CSS
- JavaScript

## Backend
- Next.js API Routes
- Server-side functionality using Next.js

## Database
- MongoDB
- MongoDB Atlas

## Authentication
- JSON Web Tokens (JWT)

## Development Tools
- Git
- GitHub
- Visual Studio Code

---

# Project Structure
```text
KrishiConnect/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── Farmer/
│   │   ├── Buyer/
│   │   ├── api/
│   │   └── ...
│   │
│   ├── components/
│   │
│   └── ...
│
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.js
└── README.md
