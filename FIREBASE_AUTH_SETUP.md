# Firebase Authentication Setup Guide

This guide explains how to fix the `auth/unauthorized-domain` error for your project.

## The Problem
Firebase Authentication (Google Login) only works on domains that you have explicitly authorized in your Firebase Console. Since you have deployed your app to GitHub Pages and are also using the AI Studio preview, you need to add these domains to the "Authorized domains" list.

## Required Domains to Add
You should add **all** of these domains to ensure the login works everywhere:

1. **GitHub Pages:** `valeridublekov.github.io`
2. **AI Studio Preview (Development):** `ais-dev-vewdv2cl2mgjqpyz3wvfut-42419084793.europe-west1.run.app`
3. **AI Studio Preview (Shared):** `ais-pre-vewdv2cl2mgjqpyz3wvfut-42419084793.europe-west1.run.app`

---

## Step-by-Step Instructions

1. **Open Firebase Console**
   Go to [console.firebase.google.com](https://console.firebase.google.com/) and select your project: **gen-lang-client-0438447557**.

2. **Navigate to Authentication**
   In the left-hand sidebar menu, click on **Authentication**.

3. **Open Settings**
   Click on the **Settings** tab at the top of the Authentication page.

4. **Authorized Domains**
   In the left-side sub-menu of the Settings tab, click on **Authorized domains**.

5. **Add the Domains**
   - Click the **Add domain** button.
   - Enter `valeridublekov.github.io` and click **Add**.
   - Click **Add domain** again.
   - Enter `ais-dev-vewdv2cl2mgjqpyz3wvfut-42419084793.europe-west1.run.app` and click **Add**.
   - Click **Add domain** again.
   - Enter `ais-pre-vewdv2cl2mgjqpyz3wvfut-42419084793.europe-west1.run.app` and click **Add**.

6. **Wait for Update**
   It usually takes **2 to 5 minutes** for Google to propagate these changes.

7. **Test the Login**
   Refresh your application at [https://valeridublekov.github.io/RoomPlanner/](https://valeridublekov.github.io/RoomPlanner/) and try to log in again.

---

### Why these domains?
- **valeridublekov.github.io**: This is where your live site is hosted. Without this, users cannot log in on your GitHub Pages site.
- **...run.app**: These are the URLs for the AI Studio preview system. If you want to use the "Login" feature while editing or previewing your app inside AI Studio, these must be authorized as well.
