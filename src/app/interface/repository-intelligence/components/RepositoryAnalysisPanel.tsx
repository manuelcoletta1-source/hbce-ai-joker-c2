"use client";

import React from "react";

interface Props {

    result: any;

}

export default function RepositoryAnalysisPanel({

    result,

}: Props) {

    if (!result) {

        return (

            <div>

                Repository analysis not executed.

            </div>

        );

    }

    return (

        <div
            style={{

                marginTop: 32,

                display: "grid",

                gap: 20,

            }}
        >

            <section>

                <h2>

                    Repository

                </h2>

                <pre>

{JSON.stringify(result.request, null, 2)}

                </pre>

            </section>

            <section>

                <h2>

                    Risks

                </h2>

                <pre>

{JSON.stringify(result.result.risks, null, 2)}

                </pre>

            </section>

            <section>

                <h2>

                    Mutation Plan

                </h2>

                <pre>

{JSON.stringify(result.result.mutationPlan, null, 2)}

                </pre>

            </section>

            <section>

                <h2>

                    Architecture

                </h2>

                <pre>

{JSON.stringify(result.result.architecture.summary, null, 2)}

                </pre>

            </section>

        </div>

    );

}
