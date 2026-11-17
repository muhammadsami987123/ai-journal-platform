import { forwardRef, Module } from "@nestjs/common";
import { MoodsController } from "./moods.controller.js";
import { MoodsRepository } from "./moods.repository.js";
import { JournalsModule } from "../journals/journals.module.js";

@Module({
  imports: [forwardRef(() => JournalsModule)],
  controllers: [MoodsController],
  providers: [MoodsRepository],
  exports: [MoodsRepository]
})
export class MoodsModule {}
