
# Perceptr Web SDK


## License


MIT © [Perceptr](https://github.com/bebofit/perceptr-web-sdk)

[![npm version](https://img.shields.io/npm/v/@perceptr/web-sdk.svg)](https://www.npmjs.com/package/@perceptr/web-sdk)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

  

## Description

  

Perceptr Web SDK is a powerful, lightweight session recording and monitoring tool for web applications. It captures user interactions, network requests, console logs, and more to provide comprehensive insights into user behavior and application performance.

  

## Summary

  

This SDK enables developers to:

  

- 📹 **Session Recording**: Capture user interactions, DOM changes, and

page navigation

- 🌐 **Network Monitoring**: Track API calls, response times, and errors

- 📊 **Console Logging**: Record console activity for debugging

- 🔒 **Privacy-Focused**: Built-in data sanitization for sensitive

information

- 🧩 **Framework Agnostic**: Works with any JavaScript framework or

vanilla JS

- 🚀 **Performance Optimized**: Minimal impact on application performance

  

The SDK is designed to be lightweight, privacy-focused, and easy to integrate into any web application.


## Installation

  

```bash
# npm
npm  install  @perceptr/web-sdk

# yarn
yarn  add  @perceptr/web-sdk

# pnpm

pnpm  add  @perceptr/web-sdk

```

  

## API Reference

  

### Perceptr Object

The default export is a singleton instance with the following methods:

  
| Method | Description | Parameters |
|--------|-------------|------------|
| `init(config)` | Initialize the SDK |`config: CoreConfig` |
| `start()` | Start recording the session | Returns `Promise<void>` |
| `stop()` | Stop recording and return session data | Returns `Promise<void>` |
| `pause()` | Temporarily pause recording | None |
| `resume()` | Resume a paused recording | None |
| `identify(distinctId, traits)` | Associate the session with a user | `distinctId: string, traits?: Record<string, any>` Returns `Promise<void>` |

### Importing


```javascript

import  Perceptr, { CoreConfig, UserIdentity } from  "@perceptr/web-sdk";

```
  

### Perceptr Methods


#### `init(config: CoreConfig): void`

  

Initializes the SDK with the provided configuration.

  

```javascript

Perceptr.init({

projectId: 'your-project-id',

debug: true

});

```


#### `start(): void`

Starts recording the user session.

```javascript

await Perceptr.start();

```

#### `stop(): Promise<void>`
Stops the recording and returns the session data.
```javascript

await Perceptr.stop();
```

#### `pause(): void`

Temporarily pauses the recording.

```javascript

Perceptr.pause();

```

#### `resume(): void`

  

Resumes a paused recording.


```javascript

Perceptr.resume();

```

#### `identify(distinctId: string, traits?: Record<string, any>): void`

  

Associates the current session with a user identity.

  

```javascript

await Perceptr.identify('user-123', {

email: 'user@example.com',

name: 'John Doe',

plan: 'premium'

});

```

### Type Definitions
#### CoreConfig

```typescript

interface  CoreConfig {

projectId: string; // Required: Your Perceptr project ID

debug?: boolean; // Optional: Enable debug logging

session?: SessionConfig; // Optional: Session recording configuration

network?: NetworkMonitorConfig; // Optional: Network monitoring configuration

metadata?: Record<string, any>; // Optional: Custom metadata to include with sessions

userIdentity?: UserIdentity; // Optional: Initial user identity

}
```

#### UserIdentity

```typescript

interface  UserIdentity {

distinctId: string; // Required: Unique identifier for the user

email?: string; // Optional: User's email

name?: string; // Optional: User's name

[key: string]: any; // Optional: Any additional user properties

}
```
  
  
  

## Framework  Integration  Examples

  

### Vanilla  JavaScript

  

```html

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>Perceptr Demo</title>

</head>

<body>

<h1>Perceptr SDK Demo</h1>

<form id="login-form">

<input type="text" id="user-id" placeholder="User ID">

<input type="email" id="email" placeholder="Email">

<button type="submit">Login</button>

</form>

  

<script type="module">

import Perceptr from 'https://cdn.jsdelivr.net/npm/@perceptr/web-sdk/dist/esm/index.js';

// Initialize when the page loads

document.addEventListener('DOMContentLoaded', async() => {

Perceptr.init({

projectId: 'your-project-id'

});

await Perceptr.start();

// Optional: Identify user after login

document.getElementById('login-form').addEventListener('submit', (e) => {

e.preventDefault();

const userId = document.getElementById('user-id').value;

await Perceptr.identify(userId, {

email: document.getElementById('email').value

});

alert('User identified!');

});

// Clean up when the page is unloaded

window.addEventListener('beforeunload', () => {

Perceptr.stop();

});

});

</script>

</body>

</html>

```

  

### React

  

```jsx

// src/App.jsx

import { useEffect } from  'react';

import  Perceptr  from  '@perceptr/web-sdk';

import  LoginForm  from  './components/LoginForm';

  

function  App() {

useEffect(() => {
    const init = async () => {
// Initialize once when the app loads

Perceptr.init({

projectId: 'your-project-id'

});

await Perceptr.start();
    }
    init();
// Clean up on unmount

return () => {

 Perceptr.stop();

};

}, []);

const  handleLogin  = async (userId, email) => {

await Perceptr.identify(userId, {

email,

loginTime: new  Date().toISOString()

});

};

return (

<div  className="App">

<h1>Perceptr SDK Demo</h1>

<LoginForm  onLogin={handleLogin} />

</div>

);

}

  

export  default  App;

  

// src/components/LoginForm.jsx

import { useState } from  'react';

  

function  LoginForm({ onLogin }) {

const [userId, setUserId] =  useState('');

const [email, setEmail] =  useState('');

const  handleSubmit  = (e) => {

e.preventDefault();

onLogin(userId, email);

alert('User identified!');

};

return (

<form  onSubmit={handleSubmit}>

<input

type="text"

value={userId}

onChange={(e) =>  setUserId(e.target.value)}

placeholder="User ID"

/>

<input

type="email"

value={email}

onChange={(e) =>  setEmail(e.target.value)}

placeholder="Email"

/>

<button  type="submit">Login</button>

</form>

);

}

  

export  default  LoginForm;

```

  

### Angular

  

```typescript

// app.module.ts

import { NgModule } from  '@angular/core';

import { BrowserModule } from  '@angular/platform-browser';

import { FormsModule } from  '@angular/forms';

import { AppComponent } from  './app.component';

import { LoginFormComponent } from  './login-form/login-form.component';

  

@NgModule({

declarations: [

AppComponent,

LoginFormComponent

],

imports: [

BrowserModule,

FormsModule

],

providers: [],

bootstrap: [AppComponent]

})

export  class  AppModule { }

  

// app.component.ts

import { Component, OnInit, OnDestroy } from  '@angular/core';

import  Perceptr  from  '@perceptr/web-sdk';

  

@Component({

selector: 'app-root',

template: `

<div class="app">

<h1>Perceptr SDK Demo</h1>

<app-login-form (login)="onLogin($event)"></app-login-form>

</div>

`

})

export  class  AppComponent  implements  OnInit, OnDestroy {

async ngOnInit() {

// Initialize the SDK

Perceptr.init({

projectId: 'your-project-id'

});

await Perceptr.start();

}

ngOnDestroy() {

// Clean up

Perceptr.stop();

}

async onLogin(userData: {userId: string, email: string}) {

awaitPerceptr.identify(userData.userId, {

email: userData.email,

loginTime: new  Date().toISOString()

});

alert('User identified!');

}

}

  

// login-form.component.ts

import { Component, Output, EventEmitter } from  '@angular/core';

  

@Component({

selector: 'app-login-form',

template: `

<form (ngSubmit)="onSubmit()">

<input type="text" [(ngModel)]="userId" name="userId" placeholder="User ID">

<input type="email" [(ngModel)]="email" name="email" placeholder="Email">

<button type="submit">Login</button>

</form>

`

})

export  class  LoginFormComponent {

userId  =  '';

email  =  '';

@Output() login  =  new  EventEmitter<{userId: string, email: string}>();

onSubmit() {

this.login.emit({

userId: this.userId,

email: this.email

});

}

}

```

  

### Vue

  

```vue

<!-- App.vue -->

<template>

<div id="app">

<h1>Perceptr SDK Demo</h1>

<login-form @login="onLogin" />

</div>

</template>

  

<script>

import Perceptr from '@perceptr/web-sdk';

import LoginForm from './components/LoginForm.vue';

  

export default {

name: 'App',

components: {

LoginForm

},

created() {

// Initialize the SDK

Perceptr.init({

projectId: 'your-project-id'

});

Perceptr.start();

},

beforeUnmount() {

// Clean up

Perceptr.stop();

},

methods: {

async onLogin(userData) {

await Perceptr.identify(userData.userId, {

email: userData.email,

loginTime: new Date().toISOString()

});

alert('User identified!');

}

}

}

</script>

```
