import * as _ from "lodash";
import * as process from "process";
import * as THREE from "three";
import {getRoot, toFunctionComponent,} from './functionComponent';
import { View } from "./view";

class BoxesData {
    public data: BoxData[];
    constructor(count: number) {
        this.data = new Array(count).fill(1).map(() => ({
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Vector3(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            )
        }));
    }

    public turn() {
        this.data.forEach(d =>
            d.rotation.set(
                d.rotation.x + 0.001,
                d.rotation.y + 0.001,
                d.rotation.z + 0.001
            )
        );
    }
}

class MeshView extends View {
    constructor(public mesh: THREE.Object3D) {
        super();
    }

    add(child: MeshView) {
        super.add(child);
        this.mesh.add(child.mesh);
    }
    remove(i: number) {
        super.remove(i);
        const child = this.children[i] as MeshView;
        this.mesh.remove(child.mesh);
    }
    dispose() {
        super.dispose();
        // todo: dispose materials
    }
}

const MeshGroupFunctionComponent = toFunctionComponent<Function | undefined, MeshView>({
    create(data, parent) {
        const view = new MeshView(new THREE.Object3D());
        if (parent) {
            parent.add(view);
        }
        return view;
    },
    // update(data, view) {
    //   return view;
    // },
    dispose(view) {
        if (view) {
            view.dispose();
        }
    },
    render(data) {
        if (data) {
            data();
        }
    }
});

const MeshGroup = function(child: Function | undefined) {
    MeshGroupFunctionComponent(child);
};

const Group = toFunctionComponent({
    render(child: Function) {
        child();
    }
});

let needDraw = true;
const toggle = document.createElement("input");
toggle.type = "checkbox";
toggle.value = "checked";
toggle.onchange = () => (needDraw = !needDraw);
document.body.append(toggle);

interface BoxData {
    position: THREE.Vector3;
    rotation: THREE.Vector3;
}
const Box = toFunctionComponent<BoxData, MeshView>({
    create(data, parent) {
        const geometry = new THREE.BoxGeometry(2, 2, 2);

        const material = new THREE.MeshNormalMaterial();
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.copy(data.position);
        mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);

        const view = new MeshView(mesh);
        if (parent) {
            parent.add(view);
        }
        return view;
    },
    update(data, view) {
        if (needDraw) {
            const mesh = (view as MeshView).mesh;
            mesh.position.copy(data.position);
            mesh.rotation.set(
                data.rotation.x,
                data.rotation.y,
                data.rotation.z
            );
        }
        return view;
    },
    dispose(view) {
        if (view) {
            // todo: too many "as" here
            const mesh = (view as MeshView).mesh as THREE.Mesh;
            if (mesh.parent) {
                mesh.parent.remove(mesh);
            }
            mesh.geometry.dispose();
            const { material } = mesh;
            if (material instanceof THREE.Material) {
                material.dispose();
            } else {
                // tslint:disable-next-line:no-console
                console.warn("not supported multi materials");
            }
            view.dispose();
        }
    }
});

const rootView = new View();

const Root = getRoot(rootView);

Root(() => {
    MeshGroup(undefined);
});

const rootMesh = (rootView.children[0] as MeshView).mesh;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

scene.add(rootMesh);

let boxesData = new BoxesData(1);

const input = document.createElement("input");
input.value = boxesData.data.length + "";
input.onchange = e => {
    const count = parseInt(input.value, 10);
    if (!isNaN(count)) {
        boxesData = new BoxesData(count);
        // tslint:disable-next-line:no-console
        console.log(count);
    }
};

document.body.appendChild(input);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;

function noop(a?: any) {
    //
}

function updateComponents() {
    Root(() => {
        MeshGroup(() => {
            for (let i = 0, l = boxesData.data.length; i < l; i++) {
                // slow, 9fps, with a huge GC down to 1fps
                // function F() {
                //   Box(boxesData.data[i]);
                // }
                // function F1() {
                //   MeshGroup(F);
                // }
                // MeshGroup(F1);

                // it's slower, but faster than react
                // Group(() => {
                //   Group(() => {
                //     Group(() => {
                //       Group(() => {
                //         Group(() => {
                //           Group(() => {
                //             Group(() => {
                //               Group(() => {
                //                 Group(() => {
                //                   Group(() => {
                //                     Group(() => {
                //                       Group(() => {
                //                         Group(() => {
                //                           Group(() => {
                //                             Group(() => {
                //                               Group(() => {
                //                                 Box(boxesData.data[i]);
                //                               });
                //                             });
                //                           });
                //                         });
                //                       });
                //                     });
                //                   });
                //                 });
                //               });
                //             });
                //           });
                //         });
                //       });
                //     });
                //   });
                // });

                // fastest, 10000 boxes at stable 17fps
                Box(boxesData.data[i]);
                // noop(boxesData.data[i]);
            }
            // boxesData.data.forEach(Box);
        });
    });
}

function animate() {
    if (needDraw) {
        boxesData.turn();
    }

    updateComponents();

    if (needDraw) {
        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
}
animate();

// tslint:disable-next-line:no-var-requires
const benchmark = require("benchmark");
const Benchmark = benchmark.runInContext({ _, process });
(window as any).Benchmark = Benchmark;
(window as any).doBenchmark = () => {
    const n = 100000;
    const suite = Benchmark.Suite();
    needDraw = false;
    boxesData = new BoxesData(n);
    updateComponents();
    const title = `update ${n} components`;
    suite
        .add(title, updateComponents)
        .on("complete", function(this: any) {
            // tslint:disable-next-line:no-console
            console.log(title, this[0].stats);
        })
        .run();
};
