import { sound } from "@pixi/sound";
import { Application, Text } from "pixi.js";
import { Config } from "./config.ts";
import { GameState, TileCoordinate } from "./gameState.ts";
import { GridChunk } from "./maze-generation.ts";

export class Game {
  app: Application;
  config: Config;
  gameState: GameState | null = null;

  constructor(app: Application, config: Config) {
    this.app = app;
    this.config = config;
  }
  private generateMazeForIndex(index: number): [number, number][] {
    const newGridChunk = new GridChunk(index, this.config);
    newGridChunk.generateMaze();
    return newGridChunk.corridorMazePixels.map(({ x, y }) => [x + 1, y + 1]);
  }

  start(x: number, y: number) {
    this.resetGameState(x, y);
    let gameState = this.gameState;
    if (gameState === null) {
      throw new Error("Game state is null");
    }

    let currentSong = "musicIntro";
    const playRandomMusic = () => {
      const random = Math.random();
      if (random < 0.5) {
        currentSong = "musicLoop1";
        sound.play("musicLoop1", {
          complete: playRandomMusic,
          volume: 0.5,
          end: 17,
        });
      } else {
        currentSong = "musicLoop2";
        sound.play("musicLoop2", {
          complete: playRandomMusic,
          volume: 0.5,
          end: 17,
        });
      }
    };

    sound.play("musicIntro", {
      volume: 0.5,
      end: 17,
      complete: () => {
        playRandomMusic();
      },
    });

    gameState.onPlayerDeath((score) => {
      gameState!.destroy();
      sound.stop(currentSong);
      sound.play("death");
      this.displayGameOver(score);
    });

    window.addEventListener("keydown", (event: KeyboardEvent) => {
      const enteredLetter = event.key;
      this.handleInput(enteredLetter);
    });
  }

  displayGameOver(score: number) {
    const gameOverText = new Text({
      text: "Game Over",
      style: {
        fontFamily: "Jetbrainsmono Regular",
        fontSize: this.config.fontSize,
        fill: 0xffffff,
      },
    });
    gameOverText.x = this.app.screen.width / 2 - gameOverText.width / 2;
    gameOverText.y = this.app.screen.height / 2 - gameOverText.height / 2;
    const scoreText = new Text({
      text: `Score: ${score}`,
      style: {
        fontFamily: "Jetbrainsmono Regular",
        fontSize: this.config.fontSize,
        fill: 0xffffff,
      },
    });
    scoreText.x = this.app.screen.width / 2 - scoreText.width / 2;
    scoreText.y = this.app.screen.height / 2 + scoreText.height;
    this.app.stage.addChild(gameOverText);
    this.app.stage.addChild(scoreText);
  }

  private resetGameState(x: number, y: number) {
    const initiallyRenderedChunkCount = this.config.chunkGenerationDistance;
    const tiles = this.createInitialTilesMap(initiallyRenderedChunkCount);

    let startCoordinate: TileCoordinate = [x, y];
    this.gameState = new GameState(
      this,
      tiles,
      startCoordinate,
      initiallyRenderedChunkCount,
    );
    this.gameState.start();
  }

  private createInitialTilesMap(initialChunkCount: number): [number, number][] {
    return Array(initialChunkCount)
      .fill(0)
      .flatMap((_, index) => this.generateMazeForIndex(index));
  }

  handleInput(letter: string) {
    const gameState = this.gameState;
    if (gameState === null) {
      return;
    }
    const nextTile = gameState.findNextTile(letter);

    if (nextTile !== undefined) {
      sound.play(`pick${Math.floor(Math.random() * 6) + 1}`);
      gameState.moveTo(nextTile);
      this.renderNextChunkIfNecessary(gameState);
    } else if (letter === "Backspace" && history.length > 0) {
      sound.play(`return${Math.floor(Math.random() * 5) + 1}`);
      gameState.moveBack();
    } else {
      sound.play(`error${Math.floor(Math.random() * 4) + 1}`);
    }
  }

  private renderNextChunkIfNecessary(gameState: GameState) {
    const tilesPerChunk = this.config.chunkCellsPerGrid * 2;
    const shouldRenderNextChunk =
      gameState.currentCoordinate[0] / tilesPerChunk >
      gameState.renderedChunksCount - this.config.chunkGenerationDistance;
    if (shouldRenderNextChunk) {
      this.renderNextChunk(gameState);
    }
  }

  private renderNextChunk(gameState: GameState) {
    console.log("Rendering next chunk");
    const newTilesToRender = this.generateMazeForIndex(
      gameState.renderedChunksCount,
    );
    gameState.addPaths(newTilesToRender);
    gameState.renderedChunksCount++;
  }
}
