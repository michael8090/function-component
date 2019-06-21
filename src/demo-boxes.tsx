import * as _ from "lodash";
import * as process from "process";
import * as THREE from "three";
import {Component, Components, getRoot, toFunctionComponent} from './functionComponent';
import { View } from "./view";

const {MapItems} = Components;

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

const MeshGroupFunctionComponent = toFunctionComponent<[Function?], MeshView>(class extends Component<[Function?], MeshView> {
    componentWillMount(data: [Function?], parent: MeshView) {
        const view = new MeshView(new THREE.Object3D());
        if (parent) {
            parent.add(view);
        }
        this.view = view;
    }
    // update(data, view) {
    //   return view;
    // },
    componentWillUnmount() {
        const {view} = this;
        if (view !== undefined) {
            view.dispose();
        }
    }
    render([data]: [Function?]) {
        if (data !== undefined) {
            data();
        }
    }
});

const MeshGroup = function(child: Function | undefined) {
    MeshGroupFunctionComponent(child);
};

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

function updateStyle(mesh: THREE.Mesh, data: BoxData, config?: {scale?: number, color?: number}) {
    mesh.position.copy(data.position);
    mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);

    if (config) {
        if (config.scale) {
            mesh.scale.set(config.scale, config.scale, config.scale);
        }
        if (config.color) {
            (mesh.material as THREE.MeshBasicMaterial).color.set(config.color);
        }
    }
}

type Props = [BoxData, {scale?: number, color?: number}?, Function?];
const Box = toFunctionComponent(class extends Component<Props, MeshView> {
    componentWillMount([data, config]: Props, parent: MeshView) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);

        const material = new THREE.MeshBasicMaterial( { 
            color: (config && config.color) || 0x00f0f0,
            wireframe: true,
        } );
        material.transparent = true;
        material.opacity = 1;
        const mesh = new THREE.Mesh(geometry, material);

        updateStyle(mesh, data, config);

        const view = new MeshView(mesh);
        if (parent) {
            parent.add(view);
        }
        this.view = view;
    }
    componentWillUpdate([data, config]: Props) {
        if (needDraw) {
            const mesh = this.view!.mesh;
            updateStyle(mesh as THREE.Mesh, data, config);
        }
    }
    componentWillUnmount() {
            const {view} = this;
            const mesh = view!.mesh as THREE.Mesh;
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
            view!.dispose();
    }
    render([data, config, child]: Props) {
        if (child) {
            child();
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

const Dummy = toFunctionComponent(class extends Component<[Function?], undefined> {
    componentWillMount() {
        //
    }
    componentWillUpdate(args: [Function?]) {
        //
    }
    componentWillUnmount() {
        //
    }
    render([child]: [Function?]) {
        if (child !== undefined) {
            child();
        }
    }

})

function UpdateBoxes() {
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

        // const data = boxesData.data[i];

        // Group(() => {
        //     Group(() => {
        //       Box(data);
        //     });
        // });

        // fastest, 10000 boxes at stable 17fps
        // Box(data);

        // nested
        // Box(data, undefined, () => {
        //     Box(data, undefined, () => {
        //         Box(data)
        //     });
        // });
        
        // nested
        // Box(data, {scale: 2}, () => {
        //     Box(data, {scale: 0.5, color: 0xff00ff}, () => {
        //         Box(data, {scale: 0.5, color: 0x00ff00})
        //     });
        // });
        // noop(boxesData.data[i]);
        // Dummy(() => {
        //     Dummy(() => {
        //         Dummy();
        //     });
        //     Dummy();
        // });
        Dummy(Dummy);
        // noop();
    }
    // boxesData.data.forEach(Box);
}

function UpdateBoxesWithMapItems() {
    MapItems(
        //
        boxesData.data,
        //
        (box, i) => i,
        //
        Box
    );
}

function MeshGroupWithBoxes() {
    MeshGroup(UpdateBoxesWithMapItems);
    // MeshGroup(UpdateBoxes);
}

function updateComponents() {
    Root(MeshGroupWithBoxes);
}

let stop = false;

function animate() {
    if (needDraw) {
        boxesData.turn();
    }

    updateComponents();

    if (needDraw) {
        renderer.render(scene, camera);
    }

    if (stop === false) {
        requestAnimationFrame(animate);
    }
}
animate();

(window as any).debug = {
    setStop: (s: boolean) => stop = s,
    // tslint:disable-next-line:object-literal-sort-keys
    doUpdate: updateComponents,
    setBoxData(n: number) {
        boxesData = new BoxesData(n);
    },
    draw() {
        renderer.render(scene, camera);
    },
    getScene() {
        return scene;
    }
};

function doBenchmark() {
    const n = 50000;
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
// tslint:disable-next-line:no-var-requires
const benchmark = require("benchmark");
const Benchmark = benchmark.runInContext({ _, process });
(window as any).Benchmark = Benchmark;
(window as any).doBenchmark = doBenchmark();

doBenchmark();
