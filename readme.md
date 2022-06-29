# LBDserver
The LBDserver client API provides high-level functionality to manage resources on the LBDserver ecosystem. This ecosystem relies on the Solid specifications for data federation and decentralised identity. The LBDserver is a prototype of a "federated Common Data Environment" (CDE), and is one of the main deliverables of the PhD project of [Jeroen Werbrouck](https://www.researchgate.net/profile/Jeroen-Werbrouck). For more information, please have a look at the papers listed [here](#cite) or at the [WIKI](https://github.com/LBD-Hackers/lbdserver-client-api/wiki).

## Installation
You can install this library with `npm install lbdserver-client-api`.

## Content
The library exposes four Classes: 
* LbdService: basic LBDserver-oriented interactions with the Pod (e.g. validate and create LBD project repository)
* LbdProject: interactions with LBDserver projects
* LbdDataset: interactions with datasets of LBDserver projects
* LbdConcept: interactions with "abstract concepts", which relate the identifiers from multiple sources
* LbdDistribution: interactions with distributions of datasets of LBDserver projects.

Further documentation on the functionality of each of these classes is available at [https://lbd-hackers.github.io/lbdserver-client-api/](https://lbd-hackers.github.io/lbdserver-client-api/).


## Usage and Testing
In order to run tests (`npm run test`) which is also the preferred way of further developing the library (write test and make sure that it passes) you need to first have a local solid community server running, and you need to get credentials that you copy-paste to the `credentials.js` file.

### Run local Solid Community server
* `npm install -g @solid/community-server`
* `community-solid-server`
* [Register a new account](http://localhost:3000/idp/register/)
* Now you have a new WebId (e.g. http://localhost:3000/test/profile/card#me): a username for the Web!

### Get session token
This is needed for running the tests or using the library server-side.
* `npx @inrupt/generate-oidc-token`
* Choose `My Solid Identity provider is not on the list` and type `http://localhost:3000/`
* Choose `No` ("Has your app been pre-registered by the administrator of the Pod server you are signing in to?)
* Type name of the app (`consolid`)
* Open link in browser (eg. http://localhost:3000/idp/auth?client_id=NFJUCr4Yc0ohwMetVisSB&scope=openid%20offline_access%20webid&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2F&code_challenge=nOIZMSXw0u0OL9GJg7hJMVN09gn05xsM_nxlhfkH6rU&state=7eTv9ZA1rPwx2CH1CrTJqIAVafbc95lZOyxpaZ3_1BM&code_challenge_method=S256&prompt=consent) and login
* You shouls now receive credentials like below

```json
{
  "refreshToken" : "BB",
  "clientId"     : "AA",
  "clientSecret" : "XX",
  "oidcIssuer"   : "http://localhost:3000/",
}
```

## Build and deploy
Building the library is handled with the `npm run build` command. This generates the `lib` folder and its content. We build ESM and UMD bundles that can be directly included in an HTML document. Furthermore, we build a CommonJS and an ESM version.

Bundles are build using the configuration in `rollup.config.js`.

## Cite
When citing work on the LBDserver, please refer to:
```
@article{werbroucklbdserver,
  title={LBDserver - a Federated Ecosystem for Heterogeneous Linked Building Data},
  author={Werbrouck, Jeroen and Pauwels, Pieter and Beetz, Jakob and Mannens, Erik}
}

@inproceedings{werbrouck2021data,
  title={Data patterns for the organisation of federated linked building data},
  author={Werbrouck, Jeroen and Pauwels, Pieter and Beetz, Jakob and Mannens, Erik},
  booktitle={Proceedings of the 9th Linked Data in Architecture and Construction Workshop},
  pages={79-90},
  year={2021}
}

@inproceedings{werbrouck2019towards,
  title={Towards a decentralised common data environment using linked building data and the solid ecosystem},
  author={Werbrouck, Jeroen and Pauwels, Pieter and Beetz, Jakob and van Berlo, L{\'e}on},
  booktitle={36th CIB W78 2019 Conference},
  pages={113--123},
  year={2019},
  url = {https://biblio.ugent.be/publication/8633673}
}

```
