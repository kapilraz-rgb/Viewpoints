// % color="#4A90E2" icon="\uf030" block="View Points"
namespace viewpoints {

    export interface ViewpointData {
        name: string;
        location: tiles.Location;
    }

    // Explicitly typed storage arrays with four predefined slots
    export let viewpointRegistry: ViewpointData[] = [];
    export let playerViewpointNames: string[] = ["", "", "", ""];
    export let playerWorldSprites: Sprite[] = [null, null, null, null];
    export let playerAngles: number[] = [0, 0, 0, 0];

    let moveSpeed = 2;
    let turnSpeed = 4;

    /**
     * Internal helper function to safely fetch multiplayer controllers by index
     */
    function getPlayerController(index: number): controller.Controller {
        if (index === 0) return controller.player1;
        if (index === 1) return controller.player2;
        if (index === 2) return controller.player3;
        return controller.player4;
    }

    // --- BACKGROUND PERSPECTIVE ENGINE ---
    control.runInParallel(function () {
        while (true) {
            for (let i = 0; i < 4; i++) {
                let playerNum = i + 1;
                let worldSprite = playerWorldSprites[i];
                let ctrl = getPlayerController(i);

                // SCENARIO 1: The Player is moving / rendering their avatar on the map
                if (worldSprite) {
                    if (ctrl.left.isPressed()) {
                        playerAngles[i] = (playerAngles[i] - turnSpeed + 360) % 360;
                    }
                    if (ctrl.right.isPressed()) {
                        playerAngles[i] = (playerAngles[i] + turnSpeed) % 360;
                    }

                    let angleRad = (playerAngles[i] * Math.PI) / 180;
                    if (ctrl.up.isPressed()) {
                        worldSprite.x += Math.cos(angleRad) * moveSpeed;
                        worldSprite.y += Math.sin(angleRad) * moveSpeed;
                    }
                    if (ctrl.down.isPressed()) {
                        worldSprite.x -= Math.cos(angleRad) * moveSpeed;
                        worldSprite.y -= Math.sin(angleRad) * moveSpeed;
                    }

                    // --- DIRECT CONNECT TO THE RAYCASTING EXTENSION ---
                    if (playerNum == 1) {
                        // @ts-ignore
                        if (typeof raycasting !== "undefined") {
                            // @ts-ignore
                            raycasting.setViewAngle(playerAngles[i]);
                        }
                    }
                }

                // SCENARIO 2: This player console is looking through a static Security Camera
                else {
                    let camName = playerViewpointNames[i];
                    if (camName !== "") {
                        let targetCam: ViewpointData = null;
                        for (let j = 0; j < viewpointRegistry.length; j++) {
                            if (viewpointRegistry[j].name === camName) {
                                targetCam = viewpointRegistry[j];
                                break;
                            }
                        }

                        if (targetCam) {
                            if (ctrl.left.isPressed()) playerAngles[i] = (playerAngles[i] - turnSpeed + 360) % 360;
                            if (ctrl.right.isPressed()) playerAngles[i] = (playerAngles[i] + turnSpeed) % 360;

                            if (playerNum == 1) {
                                // @ts-ignore
                                if (typeof raycasting !== "undefined") {
                                    // @ts-ignore
                                    raycasting.setViewAngle(playerAngles[i]);
                                }
                            }
                        }
                    }
                }
            }
            pause(20);
        }
    });

    /**
     * Set a physical viewpoint (like a wall camera) at a specific tilemap location
     */
    // % block="Set viewpoint %name at %loc"
    // % name.defl="cam1"
    export function setViewpoint(name: string, loc: tiles.Location): void {
        let found = false;
        for (let i = 0; i < viewpointRegistry.length; i++) {
            if (viewpointRegistry[i].name === name) {
                viewpointRegistry[i].location = loc;
                found = true;
                break;
            }
        }
        if (!found) {
            viewpointRegistry.push({ name: name, location: loc });
        }
    }

    /**
     * Point a player's monitor feed to a static camera viewpoint (e.g. Monitoring room)
     */
    // % block="Initialize viewpoint %name for player %playerNum"
    // % name.defl="cam1" playerNum.min=1 playerNum.max=4
    export function initializeViewpointForPlayer(name: string, playerNum: number): void {
        if (playerNum < 1 || playerNum > 4) return;

        playerWorldSprites[playerNum - 1] = null;
        playerViewpointNames[playerNum - 1] = name;
        playerAngles[playerNum - 1] = 0;
    }

    /**
     * Establish a player's visible sprite avatar and what style costume other players see them as!
     */
    // % block="Set player %spriteName=variables_get(sprite) %img=screen_image_picker to look from different viewpoints for player %playerNum"
    // % playerNum.min=1 playerNum.max=4
    export function setPlayerSpriteView(spriteName: Sprite, img: Image, playerNum: number): void {
        if (playerNum < 1 || playerNum > 4 || !spriteName) return;

        playerViewpointNames[playerNum - 1] = "";
        playerWorldSprites[playerNum - 1] = spriteName;
        playerAngles[playerNum - 1] = 0;

        spriteName.setImage(img);
    }

    /**
     * Remove a viewpoint completely from the system memory
     */
    // % block="Destroy Viewpoint %name"
    // % name.defl="cam1"
    export function destroyViewpoint(name: string): void {
        for (let i = viewpointRegistry.length - 1; i >= 0; i--) {
            if (viewpointRegistry[i].name === name) {
                viewpointRegistry.removeAt(i);
            }
        }
        for (let i = 0; i < 4; i++) {
            if (playerViewpointNames[i] === name) {
                playerViewpointNames[i] = "";
            }
        }
    }
}






