FROM mongo

# Create app directory
WORKDIR /app

# Install app dependencies
COPY replicaSet.js .
COPY setup.sh .

CMD ["./setup.sh"]