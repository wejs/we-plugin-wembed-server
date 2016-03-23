# we-plugin-wembed-server

> We.js wembed server plugin
> 
> Add suport to parse metadata from sites and expose as JSON or HTML
> 

Example with HTML: https://wejs.org/api/v1/embed?url=https://www.youtube.com/watch?v=1G4isv_Fylg

Example with JSON: https://wejs.org/api/v1/json?url=https://www.youtube.com/watch?v=1G4isv_Fylg

## Installation

In your we.js project

```sh
npm install --save we-plugin-wembed-server
```

## Configuration

In you configuration file:

    wembed: {
      // time to refesh page cache
      refreshTime: 3600000,
      // size of images
      image: {
        width: 200,
        height: 200,
      }
    }

## URLS

Get wembed in JSON:

```
get /api/v1/:wembedType/json?url=https://www.youtube.com/watch?v=1G4isv_Fylg
```

Get wembed in HTML:

```
get /api/v1/:wembedType/embed?url=https://www.youtube.com/watch?v=1G4isv_Fylg
```

## Links

> * We.js site: http://wejs.org

## License

[the MIT license](https://github.com/wejs/we/blob/master/LICENSE.md)