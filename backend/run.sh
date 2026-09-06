#!/bin/bash

VALID_ARGS=("spring-boot:run" "clean" "install" "clean install" "test" "package" "compile")

if [ $# -eq 0 ]; then
    ./mvnw spring-boot:run
else
    ARG="$*"
    for valid in "${VALID_ARGS[@]}"; do
        if [ "$ARG" = "$valid" ]; then
            ./mvnw $ARG
            exit 0
        fi
    done
    echo "Invalid argument: '$ARG'"
    echo ""
    echo "Valid arguments:"
    for valid in "${VALID_ARGS[@]}"; do
        echo "  ./run.sh $valid"
    done
    exit 1
fi