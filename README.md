# Backend for Wave Finder - Final Project at Technigo Bootcamp

This project aims to create a backend system for a Surfblog community. The application enables registred users to save favorite posts, like posts and create and their own posts/recommendations. Users can edit their posts, filter on saved and created posts. Users are also able to check the wetaher forecast through a public Open Weather API.
Created in collaboration with [Emma Engvall](https://github.com/EmmaEngvall) as a final project for our Technigo web development bootcamp.

## Objective

The primary challenge was to design a system capable of securely handling user registration, authentication and managing data related to created posts, saved favourites, liked posts. Also which user liked/saved wich posts. To be able to have the functionality to remove/add from that specific user. 

## Features

Fetch all posts, not authenticated endpoint
User registration and login
Authenticated access to user specific data
Authenticated access for the user to like, save as favorite, edit and delete posts

## Technologies used:
- Node.js
- Express
- CORS
- Mongoose
- MongoDB
- bcrypt
- crypto

## Endpoints/Routes
/
GET - Fetch all endpoints

/register
POST - Create a new user. Validation of unique username and email are performed

/login
POST - Authenticate the user

/surfposts
GET - Fetch all posts in the database, no authentication needed
POST - Create new post, authenticated endpoint

/surfposts/:surfPostID/like
PATCH - To pull/push the user id for this specic post in the property likedByUser

/surfposts/:surfPostID/addfav
PATCH - To pull/push the user id for this specic post in the property savedFavByUser

/surfposts/:surfPostID/delete
DELETE - To delete the specific post, can be done by the authenticated user that created the post

/surfposts/:surfPostID/update
PATCH - To edit posts, can be done by the authenticated user that created the post

/mysurfposts
GET - Fetch all posts by the authenticated user

/myfavsurfposts
GET - Fetch all posts saved as favourite by the authenticated user

[API Deployed on Google Cloud](https://backend-final-project-technigo-ognztdcbaq-no.a.run.app/)

[Deployed Frontend application Wave Finder](https://wave-finder.netlify.app/)

[Frontend repository](https://github.com/EmmaEngvall/frontend-final-project-technigo)

