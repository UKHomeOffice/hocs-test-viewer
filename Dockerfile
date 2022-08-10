FROM node:18

ARG VERSION
EXPOSE 3000

ENV USER user_hocs_docs
ENV USER_ID 1001
ENV GROUP group_hocs_docs
ENV NAME hocs-docs

WORKDIR /app
RUN mkdir -p /app

RUN groupadd -r ${GROUP} && \
    useradd -r -u ${USER_ID} -g ${GROUP} ${USER} -d /app && \
    mkdir -p /app && \
    chown -R ${USER}:${GROUP} /app

COPY ./ /app
RUN chmod a+x /app/run.sh

RUN npm --loglevel warn install

RUN cat /app/run.sh
USER ${USER_ID}

ENTRYPOINT /app/run.sh
