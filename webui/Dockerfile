FROM node:16.16.0-buster AS build
 WORKDIR /build

 COPY package.json package.json
 COPY package-lock.json package-lock.json
 RUN npm ci

 COPY public/ public
 COPY src/ src
 RUN npm run build

 FROM httpd:alpine
 WORKDIR /usr/local/apache2/htdocs

 COPY --from=build /build/build/ .

 RUN chown -R www-data:www-data /usr/local/apache2/htdocs

 RUN sed -i "s/Listen 80/Listen \${PORT}/g" /usr/local/apache2/conf/httpd.conf

 RUN echo 'RewriteEngine on' > .htaccess \
     && echo 'RewriteCond %{REQUEST_FILENAME} !-f' >> .htaccess \
     && echo 'RewriteCond %{REQUEST_FILENAME} !-d' >> .htaccess \
     && echo 'RewriteRule ^ index.html [L]' >> .htaccess

 RUN sed -i 's/#LoadModule rewrite_module modules\/mod_rewrite.so/LoadModule rewrite_module modules\/mod_rewrite.so/' /usr/local/apache2/conf/httpd.conf

 RUN sed -i '/<Directory "\/usr\/local\/apache2\/htdocs">/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /usr/local/apache2/conf/httpd.conf