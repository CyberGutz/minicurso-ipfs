# Helia Drive

Pequena demonstração de um app de armazenamento em nuvem usado no minicurso de introdução ao IPFS com Helia, na XV jornada de educação, ciência e tecnologia do IFMG Campus Formiga. Espero que gostem!


## Comandos úteis

Para instalar as dependências do app:
```
    npm install
``` 

Como é um site estático, precisamos sempre antes de testar, fazer o build do app:
```
    npm run build
``` 

Para visualizar o app:
```
    npm run preview
``` 

Para publicar o app e vê-lo no browser diretamente do seu gateway local do ipfs:
```
    ipfs add -r ./build
```

No browser:
```
    localhost:8080/ipfs/<CID obtido no comando anterior>
```
