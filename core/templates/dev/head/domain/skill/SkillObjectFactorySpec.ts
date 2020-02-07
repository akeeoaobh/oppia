// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for SkillObjectFactory.
 */
import { ConceptCardObjectFactory } from
  'domain/skill/ConceptCardObjectFactory';
import { MisconceptionObjectFactory } from
  'domain/skill/MisconceptionObjectFactory';
import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
// import predConsts from 'assets/constants';
import { RubricObjectFactory } from
  'domain/skill/RubricObjectFactory';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory.ts';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { TestBed } from '@angular/core/testing';

fdescribe('Skill object factory', () => {
  let skillObjectFactory;
  let conceptCardObjectFactory;
  let rubricObjectFactory;
  let misconceptionObjectFactory;
  let misconceptionDict1;
  let misconceptionDict2;
  let rubricDict;
  let skillContentsDict;
  let skillDict;
  let skillDifficulties;
  let subtitledHtmlObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NormalizeWhitespacePipe,
      ]
    });
    conceptCardObjectFactory = TestBed.get(ConceptCardObjectFactory);
    misconceptionObjectFactory = TestBed.get(MisconceptionObjectFactory);
    rubricObjectFactory = TestBed.get(RubricObjectFactory);
    skillDifficulties = ['Easy', 'Medium', 'Hard']
    skillObjectFactory = TestBed.get(SkillObjectFactory);
    subtitledHtmlObjectFactory = TestBed.get(SubtitledHtmlObjectFactory);
    misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true
    };

    misconceptionDict2 = {
      id: '4',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: false
    };

    rubricDict = {
      difficulty: skillDifficulties[0],
      explanation: 'explanation'
    };

    skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [
        {
          html: 'test worked example 1',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }
      ],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_1: {},
          worked_example_2: {}
        }
      }
    };
    skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      next_misconception_id: '6',
      superseding_skill_id: '2',
      all_questions_merged: false,
      prerequisite_skill_ids: ['skill_1']
    };
  });

  it('should create a new skill from a backend dictionary', () => {
    var skill = skillObjectFactory.createFromBackendDict(skillDict);
    expect(skill.getId()).toEqual('1');
    expect(skill.getDescription()).toEqual('test description');
    expect(skill.getMisconceptions()).toEqual(
      [misconceptionObjectFactory.createFromBackendDict(
        misconceptionDict1),
      misconceptionObjectFactory.createFromBackendDict(
        misconceptionDict2)]);
    expect(skill.getRubrics()).toEqual([
      rubricObjectFactory.createFromBackendDict(rubricDict)]);
    expect(skill.getConceptCard()).toEqual(
      conceptCardObjectFactory.createFromBackendDict(skillContentsDict));
    expect(skill.getLanguageCode()).toEqual('en');
    expect(skill.getVersion()).toEqual(3);
    expect(skill.getSupersedingSkillId()).toEqual('2');
    expect(skill.getAllQuestionsMerged()).toEqual(false);
    expect(skill.getPrerequisiteSkillIds()).toEqual(['skill_1']);
  });

  it('Should find misconception by id', () => {
    var skill = skillObjectFactory.createFromBackendDict(skillDict);
    expect(skill.findMisconceptionById('4')).toEqual(
      misconceptionObjectFactory.createFromBackendDict(misconceptionDict2));
  });

  it('should delete a misconception given its id', () => {
    var skill = skillObjectFactory.createFromBackendDict(skillDict);
    skill.deleteMisconception('2');
    expect(skill.getMisconceptions()).toEqual(
      [misconceptionObjectFactory.createFromBackendDict(
        misconceptionDict2)]);
  });

  it('should throw validation errors', () => {
    var skill = skillObjectFactory.createFromBackendDict(skillDict);
    skill.getConceptCard().setExplanation(
      subtitledHtmlObjectFactory.createDefault('', 'review_material'));
    expect(skill.getValidationIssues()).toEqual([
      'There should be review material in the concept card.',
      'All 3 difficulties (Easy, Medium and Hard) should be addressed ' +
      'in rubrics.'
    ]);
  });

  it('should add/update a rubric given difficulty', () => {
    var skill = skillObjectFactory.createFromBackendDict(skillDict);
    expect(skill.getRubrics()[0].getExplanation()).toEqual('explanation');
    expect(skill.getRubrics().length).toEqual(1);

    skill.updateRubricForDifficulty(skillDifficulties[0], 'new explanation');
    expect(skill.getRubrics()[0].getExplanation()).toEqual('new explanation');

    skill.updateRubricForDifficulty(skillDifficulties[1], 'explanation 2');
    expect(skill.getRubrics().length).toEqual(2);
    expect(skill.getRubrics()[1].getExplanation()).toEqual('explanation 2');

    expect(() => {
      skill.updateRubricForDifficulty('invalid difficulty', 'explanation 2');
    }).toThrow('hey');
  });

  it('should get the correct next misconception id', () => {
    var skill = skillObjectFactory.createFromBackendDict(skillDict);
    expect(skill.getNextMisconceptionId()).toEqual('6');
    skill.deleteMisconception(4);
    expect(skill.getNextMisconceptionId()).toEqual('6');

    var misconceptionToAdd1 = misconceptionObjectFactory
      .createFromBackendDict({
        id: skill.getNextMisconceptionId(),
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback',
        must_be_addressed: true
      });

    skill.appendMisconception(misconceptionToAdd1);
    expect(skill.getNextMisconceptionId()).toEqual('7');
    skill.deleteMisconception(6);
    expect(skill.getNextMisconceptionId()).toEqual('7');
  });

  it('should convert to a backend dictionary', () => {
    var skill = skillObjectFactory.createFromBackendDict(skillDict);
    expect(skill.toBackendDict()).toEqual(skillDict);
  });

  it('should be able to create an interstitial skill', () => {
    var skill = skillObjectFactory.createInterstitialSkill();
    expect(skill.getId()).toEqual(null);
    expect(skill.getDescription()).toEqual('Skill description loading');
    expect(skill.getMisconceptions()).toEqual([]);
    expect(skill.getRubrics()).toEqual([]);
    expect(skill.getConceptCard()).toEqual(
      conceptCardObjectFactory.createInterstitialConceptCard());
    expect(skill.getLanguageCode()).toEqual('en');
    expect(skill.getVersion()).toEqual(1);
    expect(skill.getSupersedingSkillId()).toEqual(null);
    expect(skill.getAllQuestionsMerged()).toEqual(false);
    expect(skill.getPrerequisiteSkillIds()).toEqual([]);
  });
});
