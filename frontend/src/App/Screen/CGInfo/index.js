import { Box, Flex, SlideFade, HStack, Tag, Text, Center, Button, ButtonGroup, IconButton, Icon, useToast,Tabs, TabList, TabPanels, Tab, TabPanel, VStack, Avatar } from "@chakra-ui/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FaCopy, FaPlay, FaSearch, FaSpinner } from "react-icons/fa"
import { useLocation, useNavigate } from "react-router-dom"
import { SiteFooter, SiteHeader } from "../../Component"
import { debounce } from "lodash"
import { GET_cgById, GET_query, POST_getFav, POST_toggleFav } from "../../Service/shipgirl"
import { MdFavorite, MdFavoriteBorder } from "react-icons/md"
import { Live2DModel } from 'pixi-live2d-display/cubism4';
import * as PIXI from 'pixi.js';
import {Spine} from 'pixi-spine';
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SimpleCharCard } from "../../Component/SimpleCGCard"

const LEGACY_THREEJS_REQUIRED_FOLDERS = ["Lane Girls", "Abyss Horizon"]
const LEGACY_CHIBI_REQUIRED_FOLDERS = ["Black Surgenights", "Azur Lane"]
const LEGACY_SPINE_REQUIRED_FOLDER = ["Black Surgenights"]

const nation_name_to_twemoji_flag = (name) => {
    // if not found, get question mark
    return {
        "United Kingdom": "https://cdn.jsdelivr.net/gh/twitter/twemoji@v13.0.0/assets/svg/1f1ec-1f1e7.svg",
        "United State": "https://cdn.jsdelivr.net/gh/twitter/twemoji@v13.0.0/assets/svg/1f1fa-1f1f8.svg",
        "Japan": "https://cdn.jsdelivr.net/gh/twitter/twemoji@v13.0.0/assets/svg/1f1ef-1f1f5.svg",
        "Germany": "https://cdn.jsdelivr.net/gh/twitter/twemoji@v13.0.0/assets/svg/1f1e9-1f1ea.svg",
        "Soviet Union": "https://cdn.jsdelivr.net/gh/twitter/twemoji@v13.0.0/assets/svg/1f1f7-1f1fa.svg",
        "Italy": "https://cdn.jsdelivr.net/gh/twitter/twemoji@v13.0.0/assets/svg/1f1ee-1f1f9.svg",
        "Free France": "https://cdn.jsdelivr.net/gh/twitter/twemoji@v13.0.0/assets/svg/1f1eb-1f1f7.svg",
        "Vichy France": "https://cdn.jsdelivr.net/gh/twitter/twemoji@v13.0.0/assets/svg/1f1eb-1f1f7.svg",
        "China": "https://cdn.jsdelivr.net/gh/twitter/twemoji@v13.0.0/assets/svg/1f1e8-1f1f3.svg",
    }[name] || "https://cdn.jsdelivr.net/gh/twitter/twemoji@v13.0.0/assets/svg/2753.svg"
} 

const type_name_to_icon = (name) => {
    return {
        "Destroyer": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/1.png",
        "Light Cruiser": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/2.png",
        "Heavy Cruiser": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/3.png",
        "Battlecruiser": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/4.png",
        "Battleship": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/5.png",
        "Light Carrier": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/6.png",
        "Aircraft Carrier": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/7.png",
        "Submarine": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/8.png",
        "Aviation Battleship": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/10.png",
        "Repair Ship": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/12.png",
        "Monitor": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/13.png",
        "Aviation Submarine": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/17.png",
        "Large Cruiser": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/18.png",
        "Munition Ship": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/19.png",
        "Guided Missile Cruiser": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/20.png",
        "Sailing Frigate": "https://raw.githubusercontent.com/Fernando2603/AzurLane/main/images/type/22.png",
    }[name] || "https://cdn.jsdelivr.net/gh/twitter/twemoji@v13.0.0/assets/svg/2753.svg"
}
    

function useQuery() {
    const { search } = useLocation();
  
    return useMemo(() => new URLSearchParams(search), [search]);
}

const SoundCard = (props) => {
    // make a card component for playing the sound effect with a play button and the sound filename
    return (
        <Box width={'25%'} style={{ margin: '8px', minWidth: '250px' }}>
            <ButtonGroup size='md' isAttached variant='outline' onClick={() => props.onClick(props.filename)} width={'100%'}> 
                <IconButton isLoading={props.isLoading || props.isPlaying} aria-label="Play sound" icon={<Icon as={FaPlay} />} />
                {/* make button background move with props.progress (0-1) */}
                <Button isLoading={props.isLoading} width={'100%'} textOverflow={'ellipsis'} overflow={'hidden'} color='blue.400' size='md' mr='2' background={`linear-gradient(to right, #3182ce33 ${props.progress * 100}%, #00000000 ${props.progress * 100}%)`}>
                    <Text fontSize='sm'>{props.filename.slice(props.filename.lastIndexOf('/') + 1, props.filename.lastIndexOf('.'))}</Text>
                </Button>
            </ButtonGroup>
        </Box>
    )
}

function loadLegacyThreeJSLibrary() {
    const script = []
    for (let i = 0; i < 4; i++) {
        script.push(document.createElement('script'))
    }
    const head = document.getElementsByTagName('head')[0]
    script[0].src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/96/three.js'
    script[1].src = 'https://cdn.jsdelivr.net/npm/zlibjs@0.3.1/bin/zlib.min.js'
    script[2].src = '/lib/orbit-control.js'
    script[3].src = '/lib/fbx-loader.js'

    head.appendChild(script[0])
    script[0].addEventListener('load', () => {
        // console.log('legacy threejs loaded')
        head.appendChild(script[1])
        script[1].addEventListener('load', () => {
            // zlib loaded
            // console.log('zlib loaded')
            head.appendChild(script[2])
            head.appendChild(script[3])
        })
    })
}

export const CGInfo = (props) => {
    const location = useLocation()
    const query = useQuery()
    const toast = useToast()

    function showSuccessToast(msg) {
        toast({
            title: 'Success',
            description: msg,
            status: 'success',
            duration: 5000,
            isClosable: true,
        })
    }

    function showErrorToast(e) {
        toast({
            title: 'Error',
            description: e,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
    }

    function showWarningToast(msg) {
        toast({
            title: 'Warning',
            description: msg,
            status: 'warning',
            duration: 5000,
            isClosable: true,
        })
    }

    const [cgInfoState, setCgInfoState] = useState({
        char: 'Placeholder Character',
        filename: 'Placeholder Filename.png',
        folder: 'Placeholder Folder',
        is_base: true,
        is_damage: true,
        is_oath: true,
        is_retrofit: true,
        is_outfit: true,
        include_bg: true,
        is_censored: true,
        l2d: null,
        _id: '0'
    })
    
    useEffect(() => {
        if (location.state && location.state.data) {
            // console.log(location.state.data)
            setCgInfoState(location.state.data)
            if (window && document && LEGACY_THREEJS_REQUIRED_FOLDERS.includes(location.state.data.folder)) {
                loadLegacyThreeJSLibrary()
            }
        }
        else if (query.get("id")) {
            GET_cgById(query.get("id")).then((res) => {
                if (window && document && LEGACY_THREEJS_REQUIRED_FOLDERS.includes(res.folder)) {
                    loadLegacyThreeJSLibrary()
                }
                setCgInfoState(res)
            })
        }
        const container = document.getElementById("related-container");
        // where "container" is the id of the container
        container.addEventListener("wheel", function (e) {
            if (e.deltaY > 0) {
                container.scrollLeft += 100;
                e.preventDefault();
                // prevenDefault() will help avoid worrisome 
                // inclusion of vertical scroll 
            }
            else {
                container.scrollLeft -= 100;
                e.preventDefault();
            }
        });
    }, [location])


    const navigate = useNavigate()
    const [favCount, setFavCount] = useState(0)
    const [isFav, setIsFav] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isPlaying, setIsPlaying] = useState({})
    const [relateCGs, setRelateCGs] = useState([])
    const [useLegacySpine, setUseLegacySpine] = useState(false)

    const data = cgInfoState

    const modifierName = data.filename.slice(0, data.filename.lastIndexOf('.')).split('_').slice(1).join(', ')

    const onCharacterSearch = useCallback(() => {
        navigate('/ship_list', {state: {
            searchData: {
                keyword: data.char,
                keywordMod: 1,
            }
        }})
    }, [navigate, data.char])

    const onFranchiseSearch = useCallback(() => {
        navigate('/ship_list', {state: {
            searchData: {
                selectedFranchise: data.folder
            }
        }})
    }, [navigate, data.folder])

    const navigateToCG = useCallback((val) => {
        navigate('/cg_info', {state: {
            data: val
        }})
    }, [navigate])

    const searchRelateCG = useCallback(async () => {
        if (data.char === 'Placeholder Character' || data.folder === 'Placeholder Folder') return
        let query = {
            keyword: data.char,
            keywordMod: 1,
            page: 1,
            selectedFranchise: data.folder,
            strict: true,
        }

        let res = await GET_query(query).catch(e => {
            showErrorToast(e)
        })
        if (!res) return
        // remove the current cg from the list
        res = res.filter((val) => val._id !== data._id)
        //console.log(res)
        setRelateCGs(res)
    }, [data])

    async function loadChibiSpine(retry = false) {
        if (LEGACY_CHIBI_REQUIRED_FOLDERS.includes(data.folder) && !retry) {
            try {
                new global.spine.SpineWidget("spine-widget", {
                    skel: data.chibi.dir,
                    atlas: data.chibi.dir.replace('.skel', '.atlas'),
                    animation: "",
                    backgroundColor: "#000000FF",
                    fitToCanvas: true,
                    success: function (widget) {
                        //console.log(widget)
                        // widget.canvas.onclick = function () {
                        let animations = widget.skeleton.data.animations;
                        // search for index of move animation
                        let animIndex = 0
                        let moveAnimIndex = animations.findIndex((anim) => anim.name.includes('move'))
                        widget.setAnimation(animations[ moveAnimIndex !== -1 ?  moveAnimIndex : 0].name);
                        widget.canvas.onclick = function () {
                            animIndex++
                            var animations = widget.skeleton.data.animations;
                            if (animIndex >= animations.length) animIndex = 0
                            widget.setAnimation(animations[animIndex].name);
                        }

                        setUseLegacySpine(true)
                    },
                    error: function (err) {
                        console.log(err)
                        showWarningToast("Failed to load chibi spine animation, retrying...")
                        loadChibiSpine(true)
                    },
                })
            }
            catch (e) {
                console.log(e)
                showErrorToast("Critical failed to load chibi spine animation.")
            }
        }
        else {
            const chibi_spine_app = new PIXI.Application({
                view: document.getElementById('spine-canvas'),
            });

            let spineLoaderOptions = {}
            let default_skin = "normal"
            if (data.folder === "Warship Girls R") {
                // get index of the spine file
                let index = data.chibi.dir.slice(data.chibi.dir.lastIndexOf('/') + 1, data.chibi.dir.lastIndexOf('.')).replace('Ship_girl_', '')
                // console.log(index)

                spineLoaderOptions = {
                    metadata: {
                        image: PIXI.BaseTexture.from(data.chibi.dir.replace('.skel', '.png').replace('.json', '.png')),
                        spineAtlasFile: data.chibi.dir.replace('.skel', '.atlas').replace('.json', '.atlas')
                    }
                };

                // adjust alpha mode for certain spine
                if (index !== '40')
                    spineLoaderOptions.metadata.image.alphaMode = PIXI.ALPHA_MODES.PMA

                if (data.is_damage) {
                    default_skin = "damage"
                }
            }

            chibi_spine_app.loader
                .add('chibiSpineCharacter', data.chibi.dir, spineLoaderOptions)
                .load(function (loader, resources) {
                    //console.log(resources.chibiSpineCharacter)
                    const animation = new Spine(resources.chibiSpineCharacter.spineData);

                    const orig_size = [animation.width, animation.height]

                    let animation_index = 0

                    //scale to 500
                    if (orig_size[0] > 500 || orig_size[1] > 500) {
                        const target_width = Math.min(500, 500 * (orig_size[0] / orig_size[1]))
                        const target_height = Math.min(500, 500 * (orig_size[1] / orig_size[0]))
                        
                        animation.height = target_height;
                        animation.width = target_width;
                    }

                    animation.x = (chibi_spine_app.screen.width) /2;
                    animation.y = (chibi_spine_app.screen.height + animation.height) /2;

                    // add the animation to the scene and render...
                    chibi_spine_app.stage.addChild(animation);

                    // full_normal_loop for normal spine
                    if (animation.skeleton.data.skins) {
                        // console.log(default_skin)
                        if (animation.skeleton.data.findSkin(default_skin) != null) {
                            animation.skeleton.setSkinByName(default_skin);
                        }
                        else {
                            animation.skeleton.setSkinByName(animation.skeleton.data.skins[0].name);
                        }
                    }

                    if (animation.state.hasAnimation("idle")) {
                        animation.state.setAnimation(0, "idle", true);
                    }
                    else {
                        animation_index = Math.floor(Math.random() * animation.spineData.animations.length)
                        const random_anim = animation.spineData.animations[animation_index].name
                        animation.state.setAnimation(0, random_anim, true);
                    }
                    // dont run too fast
                    animation.state.timeScale = 1;

                    chibi_spine_app.view.onclick = function () {
                        animation_index++
                        if (animation_index >= animation.spineData.animations.length) animation_index = 0
                        animation.state.setAnimation(0, animation.spineData.animations[animation_index].name, true);
                    };
                    
                    chibi_spine_app.start();
                });
        }
    }


    useEffect(async () => {
        // get fav count
        if (data.char === 'Placeholder Character' || data.folder === 'Placeholder Folder') return
        setIsLoading(true)
        POST_getFav(data.char, data.folder).then((res) => {
            setFavCount(res.count)
            setIsFav(res.is_fav)
            setIsLoading(false)
        })
        searchRelateCG()

        if (data.spine) {
            if (LEGACY_SPINE_REQUIRED_FOLDER.includes(data.folder)) {
                new global.spine.SpineWidget("spine-widget-full", {
                    skel: data.spine.dir,
                    atlas: data.spine.dir.replace('.skel', '.atlas'),
                    animation: "",
                    backgroundColor: "#000000FF",
                    fitToCanvas: true,
                    success: function (widget) {
                        let animations = widget.skeleton.data.animations;
                        // search for index of move animation
                        let animIndex = 0
                        let moveAnimIndex = animations.findIndex((anim) => anim.name.includes('idle'))
                        widget.setAnimation(animations[ moveAnimIndex !== -1 ?  moveAnimIndex : 0].name);
                        widget.canvas.onclick = function () {
                            animIndex++
                            var animations = widget.skeleton.data.animations;
                            if (animIndex >= animations.length) animIndex = 0
                            widget.setAnimation(animations[animIndex].name);
                        }
                    }
                });
            }
            else {
                const spine_app = new PIXI.Application({
                    view: document.getElementById('spine-canvas-full'),
                });

                // synchroneously load extra files
                const extra_layer = []
                if (data.spine.extra_file && data.spine.extra_file.length !== 0) {
                    for (const file of data.spine.extra_file) {
                        spine_app.loader.add(file.slice(file.lastIndexOf('/') + 1), file)
                        extra_layer.push(file.slice(file.lastIndexOf('/') + 1))
                    }
                }

                spine_app.loader
                    .add('spineCharacter', data.spine.dir)
                    .load(function (loader, resources) {
                        let scale = 1
                        let animation_index = -1

                        const animation = new Spine(resources.spineCharacter.spineData);
                        const orig_size = [animation.width, animation.height]
                        // console.log(animation)

                        //calculate the scale so that animation fit a 500x500 canvas
                        scale = Math.min(500 / orig_size[0], 500 / orig_size[1])
                        if (data.folder === "Azur Lane") scale *= 1.4
                        animation.height *= scale;
                        animation.width *= scale;

                        animation.x = (spine_app.screen.width) / 2
                        animation.y = (spine_app.screen.height) / 2

                        if (data.folder === "Azur Lane") animation.y += animation.height / 3

                        animation_index = Math.floor(Math.random() * animation.spineData.animations.length)
                        
                        // add extra layers
                        for (const layer of extra_layer) {
                            const extra_layer = new Spine(resources[layer].spineData)
                            extra_layer.x = (spine_app.screen.width) / 2
                            extra_layer.y = (spine_app.screen.height) / 2
                            // azur lane only
                            extra_layer.y += animation.height / 3
                            extra_layer.height *= scale;
                            extra_layer.width *= scale;
                            spine_app.stage.addChild(extra_layer);

                            // set animation
                            if (extra_layer.state.hasAnimation("fullBg_normal_loop")) {
                                extra_layer.state.setAnimation(0, "fullBg_normal_loop", true);
                            }
                            else if (extra_layer.state.hasAnimation("full_normal_loop")) {
                                extra_layer.state.setAnimation(0, "full_normal_loop", true);
                            }
                            else {
                                const random_anim = extra_layer.spineData.animations[animation_index].name
                                extra_layer.state.setAnimation(0, random_anim, true);
                            }
                        }

                        // add the animation to the scene and render...
                        spine_app.stage.addChild(animation);

                        // full_normal_loop for normal spine
                        if (animation.state.hasAnimation("fullBg_normal_loop")) {
                            animation.state.setAnimation(0, "fullBg_normal_loop", true);
                        }
                        else if (animation.state.hasAnimation("full_normal_loop")) {
                            animation.state.setAnimation(0, "full_normal_loop", true);
                        }
                        else {
                            const random_anim = animation.spineData.animations[animation_index].name
                            animation.state.setAnimation(0, random_anim, true);
                        }
                        // dont run too fast
                        animation.state.timeScale = 1;

                        spine_app.view.onclick = function () {
                            animation_index++
                            if (animation_index >= animation.spineData.animations.length) animation_index = 0
                            animation.state.setAnimation(0, animation.spineData.animations[animation_index].name, true);

                            // set extra layers
                            for (const layer of extra_layer) {
                                const next_anim = layer.spineData.animations[animation_index].name
                                layer.state.setAnimation(0, next_anim, true);
                            }
                        };
                        
                        spine_app.start();
                    });
            }
        }

        if (data.chibi) {
            loadChibiSpine()
        }

        if (data.l2d) {
            window.PIXI = PIXI;
            // init PIXI
            const app = new PIXI.Application({
                view: document.getElementById('l2d-canvas'),
            });

            const model = await Live2DModel.from(data.l2d.dir, { autoInteract: false });
            
        
            app.stage.addChild(model);

            const orig_size = [model.width, model.height]

            //scale to 500
            const target_width = Math.min(500, 500 * (orig_size[0] / orig_size[1]))
            const target_height = Math.min(500, 500 * (orig_size[1] / orig_size[0]))

            // transforms
            model.rotation = Math.PI;
            model.skew.x = Math.PI;
            const scale_mul = (data.folder === "Azur Lane") ? 1.3 : 1
            model.scale.set(target_width / model.width * scale_mul, target_height / model.height * scale_mul);
            model.anchor.set(0.5, 0.5);
            model.x = (app.screen.width) / 2;
            model.y = (app.screen.height) / 2 ;

            model.internalModel.motionManager.startRandomMotion('');

            setInterval(() => {
                if (!model.internalModel.motionManager.playing) {
                    model.internalModel.motionManager.startRandomMotion('');
                }
            }, 66)
        }

        if (data.m3d) {
            if (LEGACY_THREEJS_REQUIRED_FOLDERS.includes(data.folder)) {
                let waiting_time = 0;
                while(!global.THREE) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    waiting_time += 500;

                    if (waiting_time > 5000) {
                        console.log("Failed to load THREE.js")
                        showErrorToast("Failed to load 3D model")
                        return;
                    }
                }
                const THREE_LEGACY = global.THREE;

                while(!THREE_LEGACY.OrbitControls || !THREE_LEGACY.FBXLoader) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    waiting_time += 500;

                    if (waiting_time > 10000) {
                        console.log("Failed to load auxiliary lib")
                        showErrorToast("Failed to load 3D model")
                        return;
                    }
                }
                
                // use legacy three bundles
                const canvas = document.getElementById('m3d-viewer');
                const MODEL_SCALE = data.folder === "Abyss Horizon" ? 100 : 12
                
                const scene = new THREE_LEGACY.Scene();
                const camera = new THREE_LEGACY.PerspectiveCamera(70, 800 / 550, 1, 10000);
                const clock = new THREE_LEGACY.Clock()
                let mixer = null;

                scene.background = new THREE_LEGACY.Color( 0xbfe3dd );
                camera.position.set(-96, 120, 96)
                camera.lookAt(new THREE_LEGACY.Vector3(0,120,0))

                const light = new THREE_LEGACY.AmbientLight( 0xffffffff ); // soft white light
                scene.add( light );

                const renderer = new THREE_LEGACY.WebGLRenderer({canvas, antialias: true});
                renderer.setSize(800, 550);

                const controls = new THREE_LEGACY.OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.09;
                controls.rotateSpeed = 0.09;

                function animate() {
                    requestAnimationFrame( animate );
                    if (mixer) mixer.update(clock.getDelta());
                    renderer.render( scene, camera );
                }

                const fbxLoader = new THREE_LEGACY.FBXLoader()
                fbxLoader.load(
                    data.m3d.dir,
                    (object) => {
                        if (object.animations?.length) {
                            mixer = new THREE_LEGACY.AnimationMixer( object );
                            const showAnim = object.animations.findIndex((anim) => anim.name === "show")
                            let action = mixer.clipAction(object.animations[showAnim !== -1 ? showAnim : 0]);
                            action.play();
                        }
                        // reset position, scale and rotation
                        object.position.set(0, -MODEL_SCALE / 2, 0);
                        object.rotation.set(0, 0, 0);
                        object.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
                            
                        scene.add(object)
                        animate();
                    },
                    (xhr) => {
                        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
                    },
                    (error) => {
                        console.log(error)
                        showErrorToast("Failed to load 3D model")
                    }
                )
            }
            else {
                // use new three bundles
                const canvas = document.getElementById('m3d-viewer');

                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(70, 880 / 500, 1, 100);

                const clock = new THREE.Clock()
                let mixer = null;

                scene.background = new THREE.Color( 0xbfe3dd );
                camera.position.set(-6, 12, 6)
                camera.lookAt(new THREE.Vector3(0,0,0))

                const light = new THREE.AmbientLight( 0xffffffff ); // soft white light
                scene.add( light );

                const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
                renderer.setSize(880, 550);

                const controls = new OrbitControls(camera, renderer.domElement);

                function animate() {
                    requestAnimationFrame( animate );
                    if (mixer) mixer.update(clock.getDelta());
                    renderer.render( scene, camera );
                }

                const gltfLoader = new GLTFLoader()

                gltfLoader.load( './data/assets/shipgirls/Abyss Horizon/char3d/100030/gltf/100030.gltf', function ( gltf ) {
                    gltf.scene.position.set(0, 0, 0);
                    gltf.scene.rotation.set(0, 0, 0);
                    gltf.scene.scale.set(1000, 1000, 1000);
                    scene.add( gltf.scene );

                    animate()
                }, undefined, function ( error ) {
                    console.error( error );
                } );

                // const fbxLoader = new FBXLoader()
                // fbxLoader.load(
                //     './data/assets/shipgirls/Abyss Horizon/char3d/100030/100030.fbx',
                //     (object) => {
                //         if (object.animations.length !== 0) {
                //             mixer = new THREE.AnimationMixer( object );
                //             const showAnim = object.animations.findIndex((anim) => anim.name === "idle")
                //             let action = mixer.clipAction(object.animations[showAnim !== -1 ? showAnim : 0]);
                //             action.play();
                //         }
                //         else {
                //             console.log("No animation found")
                //         }
                //         // reset position, scale and rotation
                //         object.position.set(0, 0, 0);
                //         object.rotation.set(0, 0, 0);
                //         object.scale.set(3, 3, 3);
                            
                //         scene.add(object)
                //         animate();
                //     },
                //     (xhr) => {
                //         console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
                //     },
                //     (error) => {
                //         console.log(error)
                //     }
                // )
            }
        }
        
    }, [data])   

    // unload the model and remove PIXI app when unmount
    useEffect(() => {
        return () => {
            global.THREE = null
            if (data.l2d) {
                PIXI.Application.destroy()
            }
        }
    }, [])

    const onToggleFavoriteDebounce = useRef(debounce((char, folder) => {
        setIsLoading(true)
        POST_toggleFav(char, folder).then((res) => {
            setFavCount(res.count)
            setIsFav(res.is_fav)
            setIsLoading(false)
        })
    }, 1000)).current

    const onToggleFavorite = () => {
        onToggleFavoriteDebounce(data.char, data.folder)
    }

    const onCopyLink = () => {
        navigator.clipboard.writeText('https://kansenindex.dev/cg_info?id=' + data._id)
        showSuccessToast('Link copied to clipboard')
    }

    const onSoundPlay = (sound) => {
        const audio = new Audio(sound)
        audio.play()
        setIsPlaying({
            ...isPlaying,
            [sound]: 0,
        })
        audio.onended = () => {
            // remove the key from isPlaying
            let newPlaying = {...isPlaying}
            delete newPlaying[sound]
            setIsPlaying(newPlaying)
        }
        // update progress
        audio.addEventListener('timeupdate', function() {
            // console.log(audio.currentTime / audio.duration * 100)
            setIsPlaying({
                ...isPlaying,
                [sound]: audio.currentTime / audio.duration
            })
        })
    }

    const soundCardList = (data.voice?.files || []).map((sound, index) => {
        return (
            <SoundCard key={index} onClick={onSoundPlay} isLoading={false} filename={sound} isPlaying={isPlaying[sound] !== undefined} progress={isPlaying[sound] ?? 0} shouldDisable={Object.keys(isPlaying).length} />
        )
    })

    const relatedCGsList = (relateCGs || []).map((cg, index) => {
        return (
            <SimpleCharCard key={index} data={cg} onCardClick={navigateToCG} />
        )
    })

    return (
        <Flex direction={'column'}>
            <SiteHeader />
            <SlideFade in={true} offsetY='-80px'>
                <Flex direction={'row'} wrap={'wrap'} marginTop={140}>
                    <Box p='16px' flex='1' minW={'360px'}>
                        <Tabs>
                            <TabList>
                                <Tab>Image</Tab>
                                {data.l2d && <Tab>Live2D</Tab>}
                                {data.chibi && <Tab>Spine (Chibi)</Tab>}
                                {data.spine && <Tab>Spine</Tab>}
                                {data.m3d && <Tab>3D <Tag ml={3} size={'md'} bg={'yellow.200'}>WIP</Tag></Tab>}
                                {data.voice && <Tab>Sound</Tab>}
                            </TabList>
                            <TabPanels>
                                <TabPanel>
                                    <Center >
                                        {/* Image */}
                                        <img style={{minHeight: '500px', margin: 'auto', objectFit: 'scale-down'}} src={data.full_dir} alt="hover_img"></img>
                                    </Center>
                                </TabPanel>
                                {data.l2d && <TabPanel>
                                    <Center>
                                        {/* Live2D */}
                                        <canvas id="l2d-canvas" height={500} style={{imageRendering: 'crisp-edges'}}></canvas>
                                    </Center>
                                    <Center margin={12}><Text as='b' fontSize='sm'>Left click the canvas to switch animation</Text></Center>
                                </TabPanel>}
                                {data.chibi && <TabPanel>
                                    <Center>
                                        {/* Spine (Chibi) */}
                                        <div style={{height: 500, width: '100%', display: useLegacySpine ? 'block' : 'none'}} id="spine-widget"></div> 
                                        <canvas style={{display: (!useLegacySpine) ? 'block' : 'none'}} id="spine-canvas" height={500}></canvas>
                                    </Center>
                                    <Center margin={12}><Text as='b' fontSize='sm'>Left click the canvas to switch animation</Text></Center>
                                </TabPanel>}
                                {data.spine && <TabPanel>
                                    <Center>
                                        {/* Spine */}
                                        {LEGACY_SPINE_REQUIRED_FOLDER.includes(data.folder) ? <div style={{height: 500, width: '100%'}} id="spine-widget-full"></div> : <canvas id="spine-canvas-full" height={500}></canvas>}
                                    </Center>
                                    <Center margin={12}><Text as='b' fontSize='sm'>Left click the canvas to switch animation</Text></Center>
                                </TabPanel>}
                                {data.m3d && <TabPanel width={'100%'}>
                                    <Center width={'100%'}>
                                        {/* 3D */}
                                        <canvas height={500} style={{width: '100%', height: 500, imageRendering: 'crisp-edges'}} id="m3d-viewer"></canvas>
                                    </Center>
                                    <Center margin={12}><Text as='b' fontSize='sm'>Use left mouse to control camera view</Text></Center>
                                </TabPanel>}
                                {data.voice && <TabPanel>
                                    <Center>
                                        {/* Sound */}
                                        <Flex direction={'row'} wrap={'wrap'} justify={'space-evenly'}>
                                            {soundCardList}
                                        </Flex>
                                    </Center>
                                </TabPanel>}
                            </TabPanels>
                        </Tabs>
                        
                    </Box>
                    <Box bg='secondary' p="32px" flex='1' minW={'360px'}>
                        <Flex bg='primary' p='16px' direction={'row'} alignItems={'center'} flexWrap={'wrap'}>
                            <Text flex='1' fontSize="lg" fontWeight={"semibold"}>Character Name</Text>
                            <Flex flex='3' bg='whiteAlpha.500' p='8px' borderRadius={'8px'} direction={'row'} alignItems={'center'} justifyContent={'space-between'} flexWrap={'wrap'}>
                                <Text flex="1" fontSize="xl" fontWeight={"semibold"} >
                                    {data.char}
                                </Text>
                                <IconButton aria-label="search character" icon={<FaSearch />} onClick={onCharacterSearch} />
                            </Flex>
                        </Flex>
                        <Flex bg='primary' mt='-8px' p='16px' direction={'row'} alignItems={'center'} flexWrap={'wrap'}>
                            <Text flex="1" fontSize="md">Modifier Name</Text>
                            <Flex flex="3" bg='whiteAlpha.500' p='8px' borderRadius={'8px'} direction={'row'} alignItems={'center'} flexWrap={'wrap'}>
                                <Text flex="1" fontSize="md">
                                    {modifierName}
                                </Text>
                                <HStack spacing={'6px'}>
                                    {data.is_base && <Tag size={'lg'} bg={'green'}>Base</Tag>}
                                    {data.is_damage && <Tag size={'lg'} bg={'red'}>Damaged</Tag>}
                                    {data.is_outfit && <Tag size={'lg'} bg={'orange'}>Outfit</Tag>}
                                    {data.is_retrofit && <Tag size={'lg'} bg={'yellow'}>Retrofit</Tag>}
                                    {data.is_oath && <Tag size={'lg'} bg={'pink'}>Oath</Tag>}
                                    {data.include_bg && <Tag size={'lg'} bg={'teal'}>Background</Tag>}
                                    {data.is_censored && <Tag size={'lg'} bg={'gray'}>Censored</Tag>}
                                </HStack>
                            </Flex>
                        </Flex>
                        <Flex bg='primary' mt='-8px' p='16px' direction={'row'} alignItems={'center'} flexWrap={'wrap'}>
                            <Text flex='1' fontSize="md">Source</Text>
                            <Flex flex='3' bg='whiteAlpha.500' p='8px' borderRadius={'8px'} direction={'row'} alignItems={'center'} justifyContent={'space-between'} flexWrap={'wrap'}>
                                <Text flex="1" fontSize="md" >
                                    {data.folder}
                                </Text>
                                <IconButton size={'sm'} aria-label="search source" icon={<FaSearch />} onClick={onFranchiseSearch}/>
                            </Flex>
                        </Flex>
                        {data.voice?.voice_actor && <Flex bg='primary' mt='-8px' p='16px' direction={'row'} alignItems={'center'} flexWrap={'wrap'}>
                            <Text flex='1' fontSize="md">Voice Actor</Text>
                            <Flex flex='3' bg='whiteAlpha.500' p='8px' borderRadius={'8px'} direction={'row'} alignItems={'center'} justifyContent={'space-between'} flexWrap={'wrap'}>
                                <Text flex="1" fontSize="md" >
                                    {data.voice?.voice_actor}
                                </Text>
                            </Flex>
                        </Flex>}
                        {data.nation && <Flex bg='primary' mt='-8px' p='16px' direction={'row'} alignItems={'center'} flexWrap={'wrap'}>
                            <Text flex='1' fontSize="md">Nation</Text>
                            <Flex flex='3' bg='whiteAlpha.500' p='8px' borderRadius={'8px'} direction={'row'} alignItems={'center'} justifyContent={'space-between'} flexWrap={'wrap'}>
                                <Tag bg={'orange'}>
                                    <Avatar
                                        src={nation_name_to_twemoji_flag(data.nation)}
                                        bg={'transparent'}
                                        name={data.nation}
                                        size='2xs'
                                        ml={-1}
                                        mr={2}
                                    />
                                    {data.nation}
                                </Tag>
                            </Flex>
                        </Flex>}
                        {data.ship_type && <Flex bg='primary' mt='-8px' p='16px' direction={'row'} alignItems={'center'} flexWrap={'wrap'}>
                            <Text flex='1' fontSize="md">Ship Type</Text>
                            <Flex flex='3' bg='whiteAlpha.500' p='8px' borderRadius={'8px'} direction={'row'} alignItems={'center'} justifyContent={'space-between'} flexWrap={'wrap'}>
                                <Tag bg={'yellow'}>
                                    <Avatar
                                        src={type_name_to_icon(data.ship_type)}
                                        bg={'transparent'}
                                        name={data.nation}
                                        size='2xs'
                                        ml={-1}
                                        mr={2}
                                    />
                                    {data.ship_type}
                                </Tag>
                            </Flex>
                        </Flex>}


                        <Flex direction={'row'} justifyContent={'space-between'}>
                            <Button mt={2} onClick={onToggleFavorite} disabled={isLoading} bgColor={isFav ? 'pink' : 'lightgray'} color={isFav ? 'purple' : 'black'}>
                                <Icon as={isLoading ? FaSpinner : isFav ? MdFavorite : MdFavoriteBorder} />
                                <Text ml={2}>{isLoading ? '...' : favCount}</Text>
                            </Button>
                            <Button mt={2}  onClick={onCopyLink}>
                                <Icon as={FaCopy} />
                                <Text ml={2}>Copy Link</Text>
                            </Button>
                        </Flex>

                        <Flex mt={12}>
                            <Text flex="1" fontSize="md" fontWeight={'bold'} >
                                Related CG
                            </Text>
                        </Flex>
                        <HStack mt={6} spacing={'6px'} overflowX={'scroll'} id="related-container">
                            {relatedCGsList}
                        </HStack>
                    </Box>
                </Flex>
            </SlideFade>
            <SiteFooter />
        </Flex>
    )
}