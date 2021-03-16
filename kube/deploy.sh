#!/bin/bash

export KUBE_NAMESPACE=${KUBE_NAMESPACE}
export KUBE_SERVER=${KUBE_SERVER}

if [[ -z ${VERSION} ]] ; then
    export VERSION=${IMAGE_VERSION}
fi

echo "deploy ${VERSION} to DEV namespace, HOCS_TEST_VIEWER_DEV drone secret"
export KUBE_TOKEN=${HOCS_TEST_VIEWER_DEV}

if [[ -z ${KUBE_TOKEN} ]] ; then
    echo "Failed to find a value for KUBE_TOKEN - exiting"
    exit -1
fi

export DNS_PREFIX=hocs-test-viewer.internal.cs-notprod
export DOMAIN_NAME=${DNS_PREFIX}.homeoffice.gov.uk

echo
echo "Deploying hocs-frontend to ${ENVIRONMENT}"
echo "domain name: ${DOMAIN_NAME}"
echo

kd --insecure-skip-tls-verify \
    -f netpol.yaml
    -f ingress.yaml \
    -f deployment.yaml \
    -f service.yaml
